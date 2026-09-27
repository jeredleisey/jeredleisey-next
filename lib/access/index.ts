import { and, asc, count, desc, eq, isNull, ne, sql } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type * as schema from '@/lib/db/schema';
import {
  account,
  accessRequest,
  role,
  rolePermission,
  user as userTable,
  userRole,
} from '@/lib/db/schema';
import { PROJECTS, getProject } from '@/lib/projects';

// Any Drizzle Postgres database with the site schema: Neon at run time, PGlite in tests.
export type SiteDb = PgDatabase<PgQueryResultHKT, typeof schema>;

export interface AccessUser {
  id: string;
  email: string;
  emailVerified: boolean;
}

export type Access =
  | { status: 'granted' }
  | { status: 'none' }
  | { status: 'pending' }
  | { status: 'declined'; retryAfter: Date };

export type RequestAccessResult =
  | { ok: true; requestId: string }
  | { ok: false; reason: 'granted' | 'pending' }
  | { ok: false; reason: 'declined'; retryAfter: Date };

export interface AccessRequestInfo {
  id: string;
  user: { id: string; name: string; email: string };
  project: string;
  note: string | null;
  status: 'pending' | 'approved' | 'declined';
  createdAt: Date;
  decidedAt: Date | null;
  roleName: string | null;
}

export type DecisionResult = { ok: true } | { ok: false; reason: 'not-found' | 'not-pending' };

export type ApproveResult = DecisionResult | { ok: false; reason: 'role-not-found' };

export interface RoleInfo {
  id: string;
  name: string;
  permissions: string[];
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  // The sign-up date.
  createdAt: Date;
  // The sign-in providers linked to this User, such as google and github.
  providers: string[];
  roles: { id: string; name: string }[];
}

export interface RoleSummary {
  id: string;
  name: string;
  // The Project slug when this Role is that Project's default Role.
  defaultForProject: string | null;
  permissions: string[];
  memberCount: number;
}

export type CreateRoleResult =
  | { ok: true; roleId: string }
  | { ok: false; reason: 'invalid-name' | 'name-taken' };

export type RenameRoleResult =
  | { ok: true }
  | { ok: false; reason: 'not-found' | 'invalid-name' | 'name-taken' };

export type UserRoleResult = { ok: true } | { ok: false; reason: 'not-found' };

export type DeleteRoleResult =
  | { ok: true }
  | { ok: false; reason: 'not-found' | 'default-role' };

export type PermissionResult =
  | { ok: true }
  | { ok: false; reason: 'not-found' | 'unknown-project' | 'default-permission' };

// A declined User can ask again this long after the decline.
const RETRY_AFTER_DECLINE_MS = 7 * 24 * 60 * 60 * 1000;

// The note on an Access Request is short. Longer text is cut to this length.
export const NOTE_MAX_LENGTH = 500;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

// A new Access Request, as the Admin notification tells it.
export interface NewAccessRequest {
  user: { name: string; email: string };
  project: string;
  note: string | null;
}

export interface AccessConfig {
  adminEmail: string | undefined;
  // The clock for the time rules. Tests pass their own.
  now?: () => Date;
  // Runs after each new Access Request is saved, to tell the Admin.
  onNewRequest?: (request: NewAccessRequest) => Promise<void>;
}

export function createAccess(db: SiteDb, config: AccessConfig) {
  const now = config.now ?? (() => new Date());
  const adminEmail = config.adminEmail ? normalizeEmail(config.adminEmail) : null;

  // The Admin is one verified email from config, never a Role (docs/adr/0001).
  function isAdmin(user: AccessUser): boolean {
    return adminEmail !== null && user.emailVerified && normalizeEmail(user.email) === adminEmail;
  }

  async function latestRequest(userId: string, project: string) {
    const [latest] = await db
      .select({ status: accessRequest.status, decidedAt: accessRequest.decidedAt })
      .from(accessRequest)
      .where(and(eq(accessRequest.userId, userId), eq(accessRequest.project, project)))
      .orderBy(desc(accessRequest.createdAt))
      .limit(1);
    return latest;
  }

  // The date after which a declined User can ask again, while that date is still ahead.
  function declineRetryAfter(
    latest: { status: string; decidedAt: Date | null } | undefined,
  ): Date | null {
    if (latest?.status !== 'declined' || !latest.decidedAt) return null;
    const retryAfter = new Date(latest.decidedAt.getTime() + RETRY_AFTER_DECLINE_MS);
    return retryAfter > now() ? retryAfter : null;
  }

  async function accessFor(user: AccessUser, project: string): Promise<Access> {
    if (isAdmin(user)) return { status: 'granted' };
    const held = await db
      .select({ roleId: userRole.roleId })
      .from(userRole)
      .innerJoin(rolePermission, eq(rolePermission.roleId, userRole.roleId))
      .where(and(eq(userRole.userId, user.id), eq(rolePermission.permission, project)))
      .limit(1);
    if (held.length > 0) return { status: 'granted' };
    const latest = await latestRequest(user.id, project);
    if (latest?.status === 'pending') return { status: 'pending' };
    const retryAfter = declineRetryAfter(latest);
    if (retryAfter) return { status: 'declined', retryAfter };
    return { status: 'none' };
  }

  async function requestAccess(
    user: AccessUser,
    project: string,
    note?: string,
  ): Promise<RequestAccessResult> {
    const current = await accessFor(user, project);
    if (current.status === 'granted') return { ok: false, reason: 'granted' };
    if (current.status === 'declined') {
      return { ok: false, reason: 'declined', retryAfter: current.retryAfter };
    }
    const [row] = await db
      .insert(accessRequest)
      .values({
        userId: user.id,
        project,
        note: note?.trim().slice(0, NOTE_MAX_LENGTH) || null,
        createdAt: now(),
      })
      // The partial unique index allows one pending request per User and Project.
      .onConflictDoNothing()
      .returning({ id: accessRequest.id, note: accessRequest.note });
    if (!row) return { ok: false, reason: 'pending' };
    // The request is saved. A notice that fails is only logged, so it never costs the
    // User the request. The User sees its state on the site either way.
    if (config.onNewRequest) {
      try {
        const [who] = await db
          .select({ name: userTable.name, email: userTable.email })
          .from(userTable)
          .where(eq(userTable.id, user.id));
        await config.onNewRequest({ user: who, project, note: row.note });
      } catch (err) {
        console.error('The notice about a new Access Request failed:', err);
      }
    }
    return { ok: true, requestId: row.id };
  }

  // Each protected Project gets one default Role that holds its Permission.
  // Safe to run any number of times.
  async function ensureProjectRoles(): Promise<void> {
    for (const project of PROJECTS.filter((p) => p.protected)) {
      await db
        .insert(role)
        .values({ name: project.defaultRoleName, defaultForProject: project.slug })
        .onConflictDoNothing();
      const [row] = await db
        .select({ id: role.id })
        .from(role)
        .where(eq(role.defaultForProject, project.slug));
      await db
        .insert(rolePermission)
        .values({ roleId: row.id, permission: project.slug })
        .onConflictDoNothing();
    }
  }

  async function defaultRoleFor(project: string): Promise<RoleInfo> {
    await ensureProjectRoles();
    const [row] = await db.select().from(role).where(eq(role.defaultForProject, project));
    if (!row) throw new Error(`No protected Project named "${project}".`);
    const perms = await db
      .select({ permission: rolePermission.permission })
      .from(rolePermission)
      .where(eq(rolePermission.roleId, row.id));
    return { id: row.id, name: row.name, permissions: perms.map((p) => p.permission) };
  }

  // True when both the User and the Role exist, so a bad id from a form never reaches a constraint.
  async function userAndRoleExist(userId: string, roleId: string): Promise<boolean> {
    if (!(await findRole(roleId))) return false;
    const [row] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.id, userId));
    return row !== undefined;
  }

  async function assignRole(user: Pick<AccessUser, 'id'>, roleId: string): Promise<UserRoleResult> {
    if (!(await userAndRoleExist(user.id, roleId))) return { ok: false, reason: 'not-found' };
    await db.insert(userRole).values({ userId: user.id, roleId }).onConflictDoNothing();
    return { ok: true };
  }

  async function removeRole(user: Pick<AccessUser, 'id'>, roleId: string): Promise<UserRoleResult> {
    if (!(await userAndRoleExist(user.id, roleId))) return { ok: false, reason: 'not-found' };
    await db
      .delete(userRole)
      .where(and(eq(userRole.userId, user.id), eq(userRole.roleId, roleId)));
    return { ok: true };
  }

  // Approves a pending request and assigns the Role, by default the Project's default Role.
  async function approve(requestId: string, roleId?: string): Promise<ApproveResult> {
    if (!UUID.test(requestId)) return { ok: false, reason: 'not-found' };
    const [request] = await db
      .select()
      .from(accessRequest)
      .where(eq(accessRequest.id, requestId));
    if (!request) return { ok: false, reason: 'not-found' };
    if (request.status !== 'pending') return { ok: false, reason: 'not-pending' };
    if (roleId !== undefined && !(await findRole(roleId))) {
      return { ok: false, reason: 'role-not-found' };
    }
    const chosenRoleId = roleId ?? (await defaultRoleFor(request.project)).id;
    return db.transaction(async (tx) => {
      const decided = await tx
        .update(accessRequest)
        .set({ status: 'approved', decidedAt: now(), roleId: chosenRoleId })
        .where(and(eq(accessRequest.id, requestId), eq(accessRequest.status, 'pending')))
        .returning({ id: accessRequest.id });
      if (decided.length === 0) return { ok: false, reason: 'not-pending' } as const;
      await tx
        .insert(userRole)
        .values({ userId: request.userId, roleId: chosenRoleId })
        .onConflictDoNothing();
      return { ok: true } as const;
    });
  }

  async function decline(requestId: string): Promise<DecisionResult> {
    if (!UUID.test(requestId)) return { ok: false, reason: 'not-found' };
    const decided = await db
      .update(accessRequest)
      .set({ status: 'declined', decidedAt: now() })
      .where(and(eq(accessRequest.id, requestId), eq(accessRequest.status, 'pending')))
      .returning({ id: accessRequest.id });
    if (decided.length > 0) return { ok: true };
    const [request] = await db
      .select({ id: accessRequest.id })
      .from(accessRequest)
      .where(eq(accessRequest.id, requestId));
    return { ok: false, reason: request ? 'not-pending' : 'not-found' };
  }

  // For the admin page: pending requests, oldest first, and past requests, latest decision first.
  async function listRequests(): Promise<{
    pending: AccessRequestInfo[];
    past: AccessRequestInfo[];
  }> {
    const base = () =>
      db
        .select({
          id: accessRequest.id,
          user: { id: userTable.id, name: userTable.name, email: userTable.email },
          project: accessRequest.project,
          note: accessRequest.note,
          status: accessRequest.status,
          createdAt: accessRequest.createdAt,
          decidedAt: accessRequest.decidedAt,
          roleName: role.name,
        })
        .from(accessRequest)
        .innerJoin(userTable, eq(userTable.id, accessRequest.userId))
        .leftJoin(role, eq(role.id, accessRequest.roleId));
    const pending = await base()
      .where(eq(accessRequest.status, 'pending'))
      .orderBy(asc(accessRequest.createdAt));
    const past = await base()
      .where(ne(accessRequest.status, 'pending'))
      .orderBy(desc(accessRequest.decidedAt));
    return { pending, past };
  }

  // Role names are unique without regard to case. The Role `exceptId` does not count.
  async function nameTaken(name: string, exceptId?: string): Promise<boolean> {
    const same = eq(sql`lower(${role.name})`, name.toLowerCase());
    const [row] = await db
      .select({ id: role.id })
      .from(role)
      .where(exceptId ? and(same, ne(role.id, exceptId)) : same)
      .limit(1);
    return row !== undefined;
  }

  async function createRole(name: string): Promise<CreateRoleResult> {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, reason: 'invalid-name' };
    if (await nameTaken(trimmed)) return { ok: false, reason: 'name-taken' };
    const [row] = await db
      .insert(role)
      .values({ name: trimmed })
      // The unique index still holds if two creates race.
      .onConflictDoNothing()
      .returning({ id: role.id });
    if (!row) return { ok: false, reason: 'name-taken' };
    return { ok: true, roleId: row.id };
  }

  async function renameRole(roleId: string, name: string): Promise<RenameRoleResult> {
    if (!UUID.test(roleId)) return { ok: false, reason: 'not-found' };
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, reason: 'invalid-name' };
    if (await nameTaken(trimmed, roleId)) return { ok: false, reason: 'name-taken' };
    const [row] = await db
      .update(role)
      .set({ name: trimmed })
      .where(eq(role.id, roleId))
      .returning({ id: role.id });
    if (!row) return { ok: false, reason: 'not-found' };
    return { ok: true };
  }

  // The schema cascades: a deleted Role leaves every User and loses its Permissions.
  async function deleteRole(roleId: string): Promise<DeleteRoleResult> {
    const found = await findRole(roleId);
    if (!found) return { ok: false, reason: 'not-found' };
    // Approval into a Project's default Role needs that Role to exist.
    if (found.defaultForProject !== null) return { ok: false, reason: 'default-role' };
    const deleted = await db
      .delete(role)
      .where(and(eq(role.id, roleId), isNull(role.defaultForProject)))
      .returning({ id: role.id });
    if (deleted.length === 0) return { ok: false, reason: 'not-found' };
    return { ok: true };
  }

  // A Role by id. An id that is not a UUID finds nothing, and never reaches Postgres.
  async function findRole(roleId: string) {
    if (!UUID.test(roleId)) return undefined;
    const [row] = await db.select().from(role).where(eq(role.id, roleId));
    return row;
  }

  // Only a protected Project from the registry is a Permission.
  function isPermission(project: string): boolean {
    return getProject(project)?.protected === true;
  }

  async function addPermission(roleId: string, project: string): Promise<PermissionResult> {
    if (!(await findRole(roleId))) return { ok: false, reason: 'not-found' };
    if (!isPermission(project)) return { ok: false, reason: 'unknown-project' };
    await db.insert(rolePermission).values({ roleId, permission: project }).onConflictDoNothing();
    return { ok: true };
  }

  async function removePermission(roleId: string, project: string): Promise<PermissionResult> {
    const found = await findRole(roleId);
    if (!found) return { ok: false, reason: 'not-found' };
    if (!isPermission(project)) return { ok: false, reason: 'unknown-project' };
    // Approval into the default Role must always grant the Project.
    if (found.defaultForProject === project) return { ok: false, reason: 'default-permission' };
    await db
      .delete(rolePermission)
      .where(and(eq(rolePermission.roleId, roleId), eq(rolePermission.permission, project)));
    return { ok: true };
  }

  // For the admin page: every User, newest first, with providers and Roles.
  async function listUsers(): Promise<UserSummary[]> {
    const users = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        emailVerified: userTable.emailVerified,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .orderBy(desc(userTable.createdAt), asc(userTable.email));
    const accounts = await db
      .selectDistinct({ userId: account.userId, providerId: account.providerId })
      .from(account)
      .orderBy(asc(account.providerId));
    const held = await db
      .select({ userId: userRole.userId, id: role.id, name: role.name })
      .from(userRole)
      .innerJoin(role, eq(role.id, userRole.roleId))
      .orderBy(asc(role.name));
    return users.map((u) => ({
      ...u,
      providers: accounts.filter((a) => a.userId === u.id).map((a) => a.providerId),
      roles: held.filter((h) => h.userId === u.id).map(({ id, name }) => ({ id, name })),
    }));
  }

  // For the admin page: every Role, by name, with its Permissions and member count.
  async function listRoles(): Promise<RoleSummary[]> {
    const roles = await db.select().from(role).orderBy(asc(role.name));
    const perms = await db.select().from(rolePermission).orderBy(asc(rolePermission.permission));
    const members = await db
      .select({ roleId: userRole.roleId, count: count() })
      .from(userRole)
      .groupBy(userRole.roleId);
    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      defaultForProject: r.defaultForProject,
      permissions: perms.filter((p) => p.roleId === r.id).map((p) => p.permission),
      memberCount: members.find((m) => m.roleId === r.id)?.count ?? 0,
    }));
  }

  return {
    accessFor,
    createRole,
    renameRole,
    deleteRole,
    addPermission,
    removePermission,
    listRoles,
    listUsers,
    isAdmin,
    ensureProjectRoles,
    defaultRoleFor,
    assignRole,
    removeRole,
    requestAccess,
    approve,
    decline,
    listRequests,
  };
}
