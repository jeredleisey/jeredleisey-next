// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createTestDb } from '@/__tests__/db/harness';
import { createUser, linkAccount } from '@/__tests__/access/fixtures';
import { createAccess } from '@/lib/access';

const ADMIN_EMAIL = 'admin@example.com';
// A well-formed id that no row has.
const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

async function setup() {
  const db = await createTestDb();
  const access = createAccess(db, { adminEmail: ADMIN_EMAIL });
  await access.ensureProjectRoles();
  return { db, access };
}

describe('Roles of a User', () => {
  it('takes away the access a Role gave when the Role is removed from the User', async () => {
    const { db, access } = await setup();
    const u = await createUser(db);
    const jevTesters = await access.defaultRoleFor('jev');
    await access.assignRole(u, jevTesters.id);
    expect(await access.accessFor(u, 'jev')).toEqual({ status: 'granted' });

    expect(await access.removeRole(u, jevTesters.id)).toEqual({ ok: true });

    expect(await access.accessFor(u, 'jev')).toEqual({ status: 'none' });
  });

  it('reports an unknown User or Role instead of an assignment', async () => {
    const { db, access } = await setup();
    const u = await createUser(db);
    const jevTesters = await access.defaultRoleFor('jev');
    const notFound = { ok: false, reason: 'not-found' };
    for (const roleId of ['not-a-role-id', UNKNOWN_ID]) {
      expect(await access.assignRole(u, roleId)).toEqual(notFound);
      expect(await access.removeRole(u, roleId)).toEqual(notFound);
    }
    expect(await access.assignRole({ id: 'no-such-user' }, jevTesters.id)).toEqual(notFound);
    expect(await access.removeRole({ id: 'no-such-user' }, jevTesters.id)).toEqual(notFound);
    expect(await access.accessFor(u, 'jev')).toEqual({ status: 'none' });
  });
});

describe('Users list', () => {
  it('lists each User with name, email, sign-up date, providers, and Roles', async () => {
    const { db, access } = await setup();
    const ana = await createUser(db, { createdAt: new Date('2026-09-02T08:00:00Z') });
    const ben = await createUser(db, { createdAt: new Date('2026-09-01T08:00:00Z') });
    await linkAccount(db, ana.id, 'google');
    await linkAccount(db, ana.id, 'github');
    const jevTesters = await access.defaultRoleFor('jev');
    const created = await access.createRole('Colleagues');
    if (!created.ok) throw new Error('create refused');
    await access.assignRole(ana, jevTesters.id);
    await access.assignRole(ana, created.roleId);

    const users = await access.listUsers();

    // The newest User comes first.
    expect(users).toEqual([
      {
        id: ana.id,
        name: ana.name,
        email: ana.email,
        createdAt: new Date('2026-09-02T08:00:00Z'),
        providers: ['github', 'google'],
        roles: [
          { id: created.roleId, name: 'Colleagues' },
          { id: jevTesters.id, name: 'Jev testers' },
        ],
      },
      {
        id: ben.id,
        name: ben.name,
        email: ben.email,
        createdAt: new Date('2026-09-01T08:00:00Z'),
        providers: [],
        roles: [],
      },
    ]);
  });
});
