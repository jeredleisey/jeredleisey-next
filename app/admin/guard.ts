import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { getAccess, getSessionUser } from '@/lib/access/server';

// proxy.ts only checks for a cookie. The real checks happen here, on the server.
// Read the session first, so that nothing touches the database at build time.

// For an admin page: a Visitor goes to sign-in, and a User who is not the Admin gets a 404.
export async function adminPageAccess(path: string) {
  const user = await getSessionUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(path)}`);
  const access = await getAccess();
  if (!access.isAdmin(user)) notFound();
  return access;
}

// For a server action: every action checks the session and the Admin itself.
// A direct POST that skips the page gets no further than the page would.
export async function adminActionAccess() {
  const user = await getSessionUser();
  if (!user) notFound();
  const access = await getAccess();
  if (!access.isAdmin(user)) notFound();
  return access;
}

// A text field from a form. A missing or non-text field reads as an empty string.
export function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}
