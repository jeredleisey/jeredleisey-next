import path from 'path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '@/lib/db/schema';

// A fresh in-memory Postgres with every migration applied.
// Tests use this instead of Neon, so they need no network and no secrets.
export async function createTestDb() {
  const db = drizzle(new PGlite(), { schema });
  await migrate(db, { migrationsFolder: path.resolve(__dirname, '../../drizzle') });
  return db;
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;
