// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createTestDb } from '@/__tests__/db/harness';
import { createUser } from '@/__tests__/access/fixtures';
import { createAccess } from '@/lib/access';
import { role } from '@/lib/db/schema';

const ADMIN_EMAIL = 'admin@example.com';

async function setup() {
  const db = await createTestDb();
  return { db, access: createAccess(db, { adminEmail: ADMIN_EMAIL }) };
}

describe('Access module', () => {
  it('gives a new User no access to the Jev Project', async () => {
    const { db, access } = await setup();
    const u = await createUser(db);
    expect(await access.accessFor(u, 'jev')).toEqual({ status: 'none' });
  });

  it('always grants the Admin', async () => {
    const { db, access } = await setup();
    const admin = await createUser(db, { email: ADMIN_EMAIL });
    expect(access.isAdmin(admin)).toBe(true);
    expect(await access.accessFor(admin, 'jev')).toEqual({ status: 'granted' });
  });

  it('matches the Admin email without regard to case or spaces', async () => {
    const { db, access } = await setup();
    const admin = await createUser(db, { email: ' Admin@Example.com ' });
    expect(access.isAdmin(admin)).toBe(true);
  });

  it('does not treat an unverified matching email as the Admin', async () => {
    const { db, access } = await setup();
    const impostor = await createUser(db, { email: ADMIN_EMAIL, emailVerified: false });
    expect(access.isAdmin(impostor)).toBe(false);
    expect(await access.accessFor(impostor, 'jev')).toEqual({ status: 'none' });
  });

  it('has no Admin when no admin email is configured', async () => {
    const db = await createTestDb();
    const access = createAccess(db, { adminEmail: undefined });
    const u = await createUser(db, { email: ADMIN_EMAIL });
    expect(access.isAdmin(u)).toBe(false);
  });

  it('grants a User whose Role holds the Project Permission', async () => {
    const { db, access } = await setup();
    const u = await createUser(db);
    const jevRole = await access.defaultRoleFor('jev');
    await access.assignRole(u, jevRole.id);
    expect(await access.accessFor(u, 'jev')).toEqual({ status: 'granted' });
  });

  it('gives each protected Project one default Role, however often setup runs', async () => {
    const { access } = await setup();
    await access.ensureProjectRoles();
    await access.ensureProjectRoles();
    const first = await access.defaultRoleFor('jev');
    const second = await access.defaultRoleFor('jev');
    expect(second.id).toBe(first.id);
    expect(first.permissions).toEqual(['jev']);
  });

  it('does not grant a User whose Role lacks the Project Permission', async () => {
    const { db, access } = await setup();
    const u = await createUser(db);
    const [other] = await db.insert(role).values({ name: 'Readers' }).returning();
    await access.assignRole(u, other.id);
    expect(await access.accessFor(u, 'jev')).toEqual({ status: 'none' });
  });
});
