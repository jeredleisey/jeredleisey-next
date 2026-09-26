import 'server-only';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { createAccess } from './index';

type SiteAccess = ReturnType<typeof createAccess>;

let ready: Promise<SiteAccess> | undefined;

// The Access module on the real database. The default Project Roles are
// made once per server process.
export function getAccess(): Promise<SiteAccess> {
  ready ??= (async () => {
    const access = createAccess(getDb(), { adminEmail: process.env.ADMIN_EMAIL });
    await access.ensureProjectRoles();
    return access;
  })().catch((err) => {
    ready = undefined;
    throw err;
  });
  return ready;
}

export async function getSessionUser() {
  // Read the request headers first: that marks the page as dynamic, so the
  // build never tries to reach the database while it prerenders.
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  return session?.user ?? null;
}
