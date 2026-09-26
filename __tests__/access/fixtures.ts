import { account, user } from '@/lib/db/schema';
import type { TestDb } from '@/__tests__/db/harness';

let n = 0;

// Inserts a User row as Better Auth would after a sign-in.
export async function createUser(
  db: TestDb,
  fields: { email?: string; emailVerified?: boolean; createdAt?: Date } = {},
) {
  n += 1;
  const row = {
    id: `user-${n}`,
    name: `User ${n}`,
    email: fields.email ?? `user${n}@example.com`,
    emailVerified: fields.emailVerified ?? true,
    ...(fields.createdAt && { createdAt: fields.createdAt }),
  };
  await db.insert(user).values(row);
  return row;
}

// Inserts a linked account row as Better Auth would after a sign-in with that provider.
export async function linkAccount(db: TestDb, userId: string, providerId: string) {
  n += 1;
  await db.insert(account).values({
    id: `account-${n}`,
    accountId: `${providerId}-${n}`,
    providerId,
    userId,
    updatedAt: new Date(),
  });
}
