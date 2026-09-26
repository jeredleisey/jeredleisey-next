'use server';

import { revalidatePath } from 'next/cache';
import { adminActionAccess, field } from '../guard';

// Approves into the Role that the Admin picked. With no Role picked, the
// Access module uses the Project's default Role.
export async function approveRequestAction(formData: FormData) {
  const access = await adminActionAccess();
  const roleId = field(formData, 'roleId');
  await access.approve(field(formData, 'requestId'), roleId || undefined);
  revalidatePath('/admin/requests');
  revalidatePath('/admin/users');
  revalidatePath('/admin/roles');
}

export async function declineRequestAction(formData: FormData) {
  const access = await adminActionAccess();
  await access.decline(field(formData, 'requestId'));
  revalidatePath('/admin/requests');
}
