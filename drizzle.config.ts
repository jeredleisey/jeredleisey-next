import { existsSync } from 'fs';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit does not load .env.local by itself. CI has no such file.
if (existsSync('.env.local')) process.loadEnvFile('.env.local');

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  out: './drizzle',
  // Migrations use the direct (unpooled) Neon connection.
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED ?? '' },
});
