import path from 'path';
import { beforeAll, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '@/lib/db/schema';

// Give each test in a file that uses the harness 15 seconds, not the
// default 5. PGlite is slow on a busy machine. Vitest resets this after
// each file, so the other test files keep the default.
vi.setConfig({ testTimeout: 15_000 });

// Start Postgres and run the migrations once per test file. Starting
// PGlite is the slow part, and doing it inside a test made the first test
// of a file time out on a busy machine.
let template: Promise<PGlite> | undefined;

function migratedTemplate(): Promise<PGlite> {
  template ??= (async () => {
    const pg = new PGlite();
    await migrate(drizzle(pg, { schema }), {
      migrationsFolder: path.resolve(__dirname, '../../drizzle'),
    });
    return pg;
  })();
  return template;
}

// Build the template before the first test of each file that uses the
// harness, with its own time budget, so a test times only its own behavior.
beforeAll(() => migratedTemplate().then(() => undefined), 30_000);

// A fresh in-memory Postgres with every migration applied: a clone of the
// template, so tests never share data. Tests use this instead of Neon, so
// they need no network and no secrets.
export async function createTestDb() {
  const pg = (await (await migratedTemplate()).clone()) as PGlite;
  return drizzle(pg, { schema });
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;
