import { and, eq } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type * as schema from '@/lib/db/schema';
import { role, rolePermission, userRole } from '@/lib/db/schema';
import { PROJECTS } from '@/lib/projects';

// Any Drizzle Postgres database with the site schema: Neon at run time, PGlite in tests.
export type SiteDb = PgDatabase<PgQueryResultHKT, typeof schema>;

export interface AccessUser {
  id: string;
  email: string;
  emailVerified: boolean;
}

export type Access = { status: 'granted' } | { status: 'none' };

export interface RoleInfo {
  id: string;
  name: string;
  permissions: string[];
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createAccess(db: SiteDb, config: { adminEmail: string | undefined }) {
  const adminEmail = config.adminEmail ? normalizeEmail(config.adminEmail) : null;

  // The Admin is one verified email from config, never a Role (docs/adr/0001).
  function isAdmin(user: AccessUser): boolean {
    return adminEmail !== null && user.emailVerified && normalizeEmail(user.email) === adminEmail;
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
    return { status: 'none' };
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

  return { accessFor, isAdmin, ensureProjectRoles, defaultRoleFor, assignRole };
}
