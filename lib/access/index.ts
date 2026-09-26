import { and, asc, desc, eq, ne } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type * as schema from '@/lib/db/schema';
import { accessRequest, role, rolePermission, user as userTable, userRole } from '@/lib/db/schema';
import { PROJECTS } from '@/lib/projects';

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

export interface RoleInfo {
  id: string;
  name: string;
  permissions: string[];
}

// A declined User can ask again this long after the decline.
const RETRY_AFTER_DECLINE_MS = 7 * 24 * 60 * 60 * 1000;

// The note on an Access Request is short. Longer text is cut to this length.
export const NOTE_MAX_LENGTH = 500;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export interface AccessConfig {
  adminEmail: string | undefined;
  // The clock for the time rules. Tests pass their own.
  now?: () => Date;
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
      .returning({ id: accessRequest.id });
    if (!row) return { ok: false, reason: 'pending' };
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

  async function assignRole(user: Pick<AccessUser, 'id'>, roleId: string): Promise<void> {
    await db.insert(userRole).values({ userId: user.id, roleId }).onConflictDoNothing();
  }

  // Approves a pending request and assigns the Role, by default the Project's default Role.
  async function approve(requestId: string, roleId?: string): Promise<DecisionResult> {
    if (!UUID.test(requestId)) return { ok: false, reason: 'not-found' };
    const [request] = await db
      .select()
      .from(accessRequest)
      .where(eq(accessRequest.id, requestId));
    if (!request) return { ok: false, reason: 'not-found' };
    if (request.status !== 'pending') return { ok: false, reason: 'not-pending' };
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

  return {
    accessFor,
    isAdmin,
    ensureProjectRoles,
    defaultRoleFor,
    assignRole,
    requestAccess,
    approve,
    decline,
    listRequests,
  };
}
