// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { createTestDb } from '@/__tests__/db/harness';
import { role } from '@/lib/db/schema';

async function tableNames(db: Awaited<ReturnType<typeof createTestDb>>) {
  const result = await db.execute<{ table_name: string }>(
    sql`select table_name from information_schema.tables where table_schema = 'public' order by table_name`,
  );
  return result.rows.map((r) => r.table_name);
}

describe('test database harness', () => {
  it('gives a fresh database with every table from the spec', async () => {
    const db = await createTestDb();
    expect(await tableNames(db)).toEqual(
      expect.arrayContaining([
        'user',
        'session',
        'account',
        'verification',
        'role',
        'role_permission',
        'user_role',
        'access_request',
        'run',
      ]),
    );
  });

  it('commits a transaction that succeeds', async () => {
    const db = await createTestDb();
    await db.transaction(async (tx) => {
      await tx.insert(role).values({ name: 'Jev testers' });
    });
    expect(await db.select({ name: role.name }).from(role)).toEqual([{ name: 'Jev testers' }]);
  });

  it('rolls back a transaction that fails', async () => {
    const db = await createTestDb();
    await expect(
      db.transaction(async (tx) => {
        await tx.insert(role).values({ name: 'Jev testers' });
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(await db.select().from(role)).toEqual([]);
  });

  it('gives each caller its own database', async () => {
    const first = await createTestDb();
    const second = await createTestDb();
    await first.insert(role).values({ name: 'Only in first' });
    expect(await second.select().from(role)).toEqual([]);
  });
});
