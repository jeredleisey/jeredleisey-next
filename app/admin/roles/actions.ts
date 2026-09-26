'use server';

import { revalidatePath } from 'next/cache';
import { adminActionAccess, field } from '../guard';
import type { RoleNameState } from './RoleNameForm';

const NAME_ERRORS = {
  'invalid-name': 'A Role needs a name.',
  'name-taken': 'Another Role has this name.',
  'not-found': 'This Role no longer exists.',
} as const;

function revalidateAdmin() {
  revalidatePath('/admin/roles');
  revalidatePath('/admin/users');
  revalidatePath('/admin/requests');
}

export async function createRoleAction(
  _previous: RoleNameState,
  formData: FormData,
): Promise<RoleNameState> {
  const access = await adminActionAccess();
  const name = field(formData, 'name');
  const result = await access.createRole(name);
  if (!result.ok) return { error: NAME_ERRORS[result.reason], name };
  revalidateAdmin();
  return { error: null };
}

export async function renameRoleAction(
  _previous: RoleNameState,
  formData: FormData,
): Promise<RoleNameState> {
  const access = await adminActionAccess();
  const name = field(formData, 'name');
  const result = await access.renameRole(field(formData, 'roleId'), name);
  if (!result.ok) return { error: NAME_ERRORS[result.reason], name };
  revalidateAdmin();
  return { error: null };
}

export async function deleteRoleAction(formData: FormData) {
  const access = await adminActionAccess();
  await access.deleteRole(field(formData, 'roleId'));
  revalidateAdmin();
}

export async function addPermissionAction(formData: FormData) {
  const access = await adminActionAccess();
  await access.addPermission(field(formData, 'roleId'), field(formData, 'project'));
  revalidateAdmin();
}

export async function removePermissionAction(formData: FormData) {
  const access = await adminActionAccess();
  await access.removePermission(field(formData, 'roleId'), field(formData, 'project'));
  revalidateAdmin();
}
