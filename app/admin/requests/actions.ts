'use server';

import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';
import { getAccess, getSessionUser } from '@/lib/access/server';

// Every action checks the session and the Admin itself. A direct POST
// that skips the page gets no further than the page would.
async function adminAccess() {
  const user = await getSessionUser();
  if (!user) notFound();
  const access = await getAccess();
  if (!access.isAdmin(user)) notFound();
  return access;
}

function requestIdFrom(formData: FormData): string {
  const id = formData.get('requestId');
  return typeof id === 'string' ? id : '';
}

// Approves into the Project's default Role.
export async function approveRequestAction(formData: FormData) {
  const access = await adminAccess();
  await access.approve(requestIdFrom(formData));
  revalidatePath('/admin/requests');
}

export async function declineRequestAction(formData: FormData) {
  const access = await adminAccess();
  await access.decline(requestIdFrom(formData));
  revalidatePath('/admin/requests');
}
