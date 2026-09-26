import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { getDb } from '@/lib/db';
import * as schema from '@/lib/db/schema';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Add it to .env.local.`);
  return value;
}

function createAuth() {
  return betterAuth({
    database: drizzleAdapter(getDb(), { provider: 'pg', schema }),
    socialProviders: {
      google: {
        clientId: required('GOOGLE_CLIENT_ID'),
        clientSecret: required('GOOGLE_CLIENT_SECRET'),
      },
      github: {
        clientId: required('GITHUB_CLIENT_ID'),
        clientSecret: required('GITHUB_CLIENT_SECRET'),
      },
    },
    account: {
      // Two sign-ins become one User only when both emails are verified.
      // Set explicitly so a change of library defaults cannot weaken it.
      // Never add Google or GitHub to trustedProviders: that skips the check.
      accountLinking: {
        enabled: true,
        requireLocalEmailVerified: true,
        trustedProviders: [],
      },
    },
    plugins: [nextCookies()],
  });
}

export type Auth = ReturnType<typeof createAuth>;

let auth: Auth | undefined;

// Built on first use, so the build needs no secrets.
export function getAuth(): Auth {
  auth ??= createAuth();
  return auth;
}
