// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createTestDb } from '@/__tests__/db/harness';
import { createUser } from '@/__tests__/access/fixtures';
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

async function newRole(access: ReturnType<typeof createAccess>, name: string) {
  const created = await access.createRole(name);
  if (!created.ok) throw new Error('create refused');
  return created.roleId;
}

describe('Roles', () => {
  it('lists a new Role with no Permissions and no members', async () => {
    const { access } = await setup();
    const created = await access.createRole('Colleagues');
    if (!created.ok) throw new Error('create refused');
    const roles = await access.listRoles();
    expect(roles.find((r) => r.id === created.roleId)).toEqual({
      id: created.roleId,
      name: 'Colleagues',
      defaultForProject: null,
      permissions: [],
      memberCount: 0,
    });
  });

  it('refuses a Role with a blank name, and trims the name it keeps', async () => {
    const { access } = await setup();
    expect(await access.createRole('   ')).toEqual({ ok: false, reason: 'invalid-name' });
    const created = await access.createRole('  Colleagues  ');
    if (!created.ok) throw new Error('create refused');
    const roles = await access.listRoles();
    expect(roles.map((r) => r.name)).toEqual(['Colleagues', 'Jev testers']);
  });

  it('refuses a Role whose name another Role has, in any case', async () => {
    const { access } = await setup();
    await access.createRole('Colleagues');
    expect(await access.createRole('Colleagues')).toEqual({ ok: false, reason: 'name-taken' });
    expect(await access.createRole('jev TESTERS')).toEqual({ ok: false, reason: 'name-taken' });
  });

  it('renames a Role, and lets a Role change the case of its own name', async () => {
    const { access } = await setup();
    const created = await access.createRole('Colleagues');
    if (!created.ok) throw new Error('create refused');
    expect(await access.renameRole(created.roleId, ' Support team ')).toEqual({ ok: true });
    expect(await access.renameRole(created.roleId, 'SUPPORT team')).toEqual({ ok: true });
    const roles = await access.listRoles();
    expect(roles.find((r) => r.id === created.roleId)?.name).toBe('SUPPORT team');
  });

  it('refuses a rename to a blank name or to the name of another Role', async () => {
    const { access } = await setup();
    const created = await access.createRole('Colleagues');
    if (!created.ok) throw new Error('create refused');
    expect(await access.renameRole(created.roleId, ' ')).toEqual({
      ok: false,
      reason: 'invalid-name',
    });
    expect(await access.renameRole(created.roleId, 'Jev Testers')).toEqual({
      ok: false,
      reason: 'name-taken',
    });
    const roles = await access.listRoles();
    expect(roles.map((r) => r.name)).toEqual(['Colleagues', 'Jev testers']);
  });

  it('reports an unknown Role instead of a rename', async () => {
    const { access } = await setup();
    for (const id of ['not-a-role-id', UNKNOWN_ID]) {
      expect(await access.renameRole(id, 'Anything')).toEqual({ ok: false, reason: 'not-found' });
    }
  });

  it('removes a deleted Role from every User, with the access it gave', async () => {
    const { db, access } = await setup();
    const ana = await createUser(db);
    const ben = await createUser(db);
    const roleId = await newRole(access, 'Colleagues');
    await access.addPermission(roleId, 'jev');
    await access.assignRole(ana, roleId);
    await access.assignRole(ben, roleId);

    expect(await access.deleteRole(roleId)).toEqual({ ok: true });

    expect(await access.accessFor(ana, 'jev')).toEqual({ status: 'none' });
    expect(await access.accessFor(ben, 'jev')).toEqual({ status: 'none' });
    const roles = await access.listRoles();
    expect(roles.map((r) => r.name)).toEqual(['Jev testers']);
  });

  it("refuses to delete a Project's default Role", async () => {
    const { db, access } = await setup();
    const u = await createUser(db);
    const jevTesters = await access.defaultRoleFor('jev');
    await access.assignRole(u, jevTesters.id);

    expect(await access.deleteRole(jevTesters.id)).toEqual({ ok: false, reason: 'default-role' });

    expect(await access.accessFor(u, 'jev')).toEqual({ status: 'granted' });
    const roles = await access.listRoles();
    expect(roles).toEqual([
      {
        id: jevTesters.id,
        name: 'Jev testers',
        defaultForProject: 'jev',
        permissions: ['jev'],
        memberCount: 1,
      },
    ]);
  });

  it('reports an unknown Role instead of a delete', async () => {
    const { access } = await setup();
    for (const id of ['not-a-role-id', UNKNOWN_ID]) {
      expect(await access.deleteRole(id)).toEqual({ ok: false, reason: 'not-found' });
    }
  });
});

describe('Permissions', () => {
  it('grants the members of a Role the Project Permission added to it', async () => {
    const { db, access } = await setup();
    const u = await createUser(db);
    const roleId = await newRole(access, 'Colleagues');
    await access.assignRole(u, roleId);
    expect(await access.accessFor(u, 'jev')).toEqual({ status: 'none' });

    expect(await access.addPermission(roleId, 'jev')).toEqual({ ok: true });

    expect(await access.accessFor(u, 'jev')).toEqual({ status: 'granted' });
    const roles = await access.listRoles();
    expect(roles.find((r) => r.id === roleId)).toMatchObject({
      permissions: ['jev'],
      memberCount: 1,
    });
  });

  it('accepts only a protected Project from the registry as a Permission', async () => {
    const { access } = await setup();
    const roleId = await newRole(access, 'Colleagues');
    expect(await access.addPermission(roleId, 'no-such-project')).toEqual({
      ok: false,
      reason: 'unknown-project',
    });
    const roles = await access.listRoles();
    expect(roles.find((r) => r.id === roleId)?.permissions).toEqual([]);
  });

  it('reports an unknown Role instead of a Permission change', async () => {
    const { access } = await setup();
    for (const id of ['not-a-role-id', UNKNOWN_ID]) {
      expect(await access.addPermission(id, 'jev')).toEqual({ ok: false, reason: 'not-found' });
    }
  });

  it('takes access away from the members of a Role that loses the Permission', async () => {
    const { db, access } = await setup();
    const u = await createUser(db);
    const roleId = await newRole(access, 'Colleagues');
    await access.addPermission(roleId, 'jev');
    await access.assignRole(u, roleId);

    expect(await access.removePermission(roleId, 'jev')).toEqual({ ok: true });

    expect(await access.accessFor(u, 'jev')).toEqual({ status: 'none' });
  });

  it("keeps a Project's Permission on that Project's default Role", async () => {
    const { db, access } = await setup();
    const u = await createUser(db);
    const jevTesters = await access.defaultRoleFor('jev');
    await access.assignRole(u, jevTesters.id);

    expect(await access.removePermission(jevTesters.id, 'jev')).toEqual({
      ok: false,
      reason: 'default-permission',
    });

    expect(await access.accessFor(u, 'jev')).toEqual({ status: 'granted' });
  });
});
