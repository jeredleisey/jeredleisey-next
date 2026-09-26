import { Pool } from '@neondatabase/serverless';
import { drizzle, type NeonDatabase } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

export type Db = NeonDatabase<typeof schema>;

let db: Db | undefined;

// The WebSocket driver (Pool) supports transactions, which Better Auth needs.
// The connection is made on first use, so nothing reads DATABASE_URL at build time.
export function getDb(): Db {
  if (db) return db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set. Add the Neon pooled connection string to .env.local.');
  db = drizzle(new Pool({ connectionString: url }), { schema });
  return db;
}
