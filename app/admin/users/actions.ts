'use server';

import { revalidatePath } from 'next/cache';
import { adminActionAccess, field } from '../guard';

// The User id comes from the form, but it only names the User to change.
// The Admin check above uses the session, never the form.

export async function assignRoleAction(formData: FormData) {
  const access = await adminActionAccess();
  await access.assignRole({ id: field(formData, 'userId') }, field(formData, 'roleId'));
  revalidatePath('/admin/users');
  revalidatePath('/admin/roles');
}

export async function removeRoleAction(formData: FormData) {
  const access = await adminActionAccess();
  await access.removeRole({ id: field(formData, 'userId') }, field(formData, 'roleId'));
  revalidatePath('/admin/users');
  revalidatePath('/admin/roles');
}
