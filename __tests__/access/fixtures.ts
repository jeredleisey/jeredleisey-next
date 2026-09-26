import { user } from '@/lib/db/schema';
import type { TestDb } from '@/__tests__/db/harness';

let n = 0;

// Inserts a User row as Better Auth would after a sign-in.
export async function createUser(
  db: TestDb,
  fields: { email?: string; emailVerified?: boolean } = {},
) {
  n += 1;
  const row = {
    id: `user-${n}`,
    name: `User ${n}`,
    email: fields.email ?? `user${n}@example.com`,
    emailVerified: fields.emailVerified ?? true,
  };
  await db.insert(user).values(row);
  return row;
}
