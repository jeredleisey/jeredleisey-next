# Auth library and Postgres host

Research for issue #15, "Which auth library and Postgres host fit this site?" The decision belongs to "Which auth library and database does the site use?". The access model comes from issue #12 and `CONTEXT.md`.

Checked on 2026-09-26 against official docs, source code at tagged releases, GitHub releases, and the npm registry. The site runs Next.js 16.2.4 and React 19.2.4 on Netlify with `@netlify/plugin-nextjs`.

## Summary

- Use **Better Auth** (1.7.6, released 2026-09-24).
- Use **Neon** Postgres through a Neon account that you own, with Drizzle.
- In `proxy.ts`, do only a cookie check for a fast redirect. Do the real session and Permission check in each Project page, in the admin pages, and in each route handler that starts a Run.
- Build Roles and Permissions as your own tables. The Better Auth role plugins do not match the model in issue #12.

## Auth libraries

### Status and maintenance

| | Better Auth | Auth.js v5 (`next-auth@beta`) |
|---|---|---|
| Latest version | 1.7.6, 2026-09-24 | 5.0.0-beta.32, 2026-07-20 (still beta) |
| Stable line | 1.7.x, with 1.6.x patches in parallel | 4.24.15 is the `latest` npm tag |
| Releases in 2026 | Many. Nine releases from 2026-08-11 to 2026-09-24 | v5: beta.31 (2026-04-14) and beta.32 (2026-07-20) |
| Next 16 peer range | `^14 \|\| ^15 \|\| ^16` | `^14.0.0-0 \|\| ^15 \|\| ^16` |
| React 19 peer range | `^18 \|\| ^19` | `^18.2.0 \|\| ^19` |
| GitHub stars | about 30,100 | about 28,400 |

Sources: [Better Auth releases](https://github.com/better-auth/better-auth/releases), [next-auth releases](https://github.com/nextauthjs/next-auth/releases), npm registry (`npm view better-auth peerDependencies`, `npm view next-auth@beta peerDependencies`, `npm view next-auth dist-tags`).

**Auth.js is now maintained by the Better Auth team.** The Auth.js README says: "Auth js is now part of Better Auth. We recommend new projects to start with Better Auth unless there are some very specific feature gaps (most notably stateless session management without a database)." The team will continue "security patches and urgent issues." Sources: [next-auth README](https://github.com/nextauthjs/next-auth), [Better Auth blog: Auth.js joins Better Auth](https://better-auth.com/blog/authjs-joins-better-auth), [Auth.js migration guide to Better Auth](https://authjs.dev/getting-started/migrate-to-better-auth).

**Other open-source options.** Lucia is deprecated: "Lucia was deprecated on March 2025." Source: [lucia-auth/lucia](https://github.com/lucia-auth/lucia). Clerk, Auth0 and similar products are hosted services, not open-source libraries, so this document does not cover them. Supabase Auth is an option only if the site also uses Supabase as its host. No other serious open-source library for Next 16 came up.

### `proxy.ts` (formerly `middleware.ts`)

Next 16 facts. "Proxy defaults to using the Node.js runtime. The `runtime` config option is not available in Proxy files." Source: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` (Next 16.2.4, section "Runtime").

**Better Auth** gives two choices in the proxy. Source: [Better Auth Next.js integration](https://www.better-auth.com/docs/integrations/next).

1. `getSessionCookie()` checks only that a session cookie exists. It makes no database call. The docs say: "THIS IS NOT SECURE! ... anyone can manually create a cookie to bypass it." Use it for a redirect only.
2. A full session check with `auth.api.getSession()`, which the Node.js runtime of the Next 16 proxy allows. It queries the database.

The docs say: "We recommend handling auth checks in each page/route."

**Auth.js v5** mounts `auth` as the proxy: `export { auth as proxy } from "@/auth"`. Source: [Auth.js installation for Next.js](https://authjs.dev/getting-started/installation?framework=Next.js).

**Netlify caveat.** The Netlify adapter runs the Next proxy as a Netlify Edge Function. It has "Full support" with limits for Node.js middleware: no C++ addons and no filesystem. Source: [Netlify Next.js overview](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/). Two open adapter bugs affect Node.js proxy files on Next 16:

- [opennextjs-netlify#3562](https://github.com/opennextjs/opennextjs-netlify/issues/3562) (opened 2026-08-24): Edge Functions bundling fails for `proxy.ts`.
- [opennextjs-netlify#3560](https://github.com/opennextjs/opennextjs-netlify/issues/3560) (opened 2026-08-21): Node.js middleware returns 500 when it imports an ESM-only package from `serverExternalPackages`.

So keep `proxy.ts` small. Import `getSessionCookie` from `better-auth/cookies` and nothing that pulls in the database driver.

### Google and GitHub

Both libraries include Google and GitHub providers.

- Better Auth GitHub: "You MUST include the user:email scope." The provider calls `https://api.github.com/user/emails` and sets `emailVerified` from GitHub's `verified` flag for that email. Sources: [Better Auth GitHub docs](https://www.better-auth.com/docs/authentication/github), [github.ts at v1.7.6](https://github.com/better-auth/better-auth/blob/v1.7.6/packages/core/src/social-providers/github.ts).
- Better Auth Google: sets `emailVerified` from the ID token claim `email_verified`. Sources: [Better Auth Google docs](https://www.better-auth.com/docs/authentication/google), [google.ts at v1.7.6](https://github.com/better-auth/better-auth/blob/v1.7.6/packages/core/src/social-providers/google.ts).
- Auth.js GitHub: also calls `/user/emails`, but it keeps only the primary email and drops the `verified` flag. Source: [Auth.js github.ts](https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/providers/github.ts).

### Account linking by verified email

Issue #12 says: "Two sign-ins with the same email become one User only when both providers report the email as verified."

**Better Auth does this by default.** In `handleOAuthUserInfo`, an OAuth sign-in links to an existing User with the same email only when all of these are true. Source: [link-account.ts at v1.7.6](https://github.com/better-auth/better-auth/blob/v1.7.6/packages/better-auth/src/oauth2/link-account.ts).

- The new provider reports the email as verified, or the provider is in `trustedProviders`.
- The existing User row has `emailVerified = true`. This is `accountLinking.requireLocalEmailVerified`, default `true`. A code comment says the gate will become unconditional in a later minor version.
- Account linking is on and `disableImplicitLinking` is not `true`.

If a check fails, sign-in fails with "account not linked." The existing User does not change. This check on both sides blocks the pre-hijack attack, where an attacker first creates an unverified account with the victim's email. Do **not** put Google or GitHub in `trustedProviders`. The docs warn that trusting a provider "may increase the risk of account takeover." Source: [Better Auth users and accounts](https://www.better-auth.com/docs/concepts/users-accounts).

**Auth.js does not do this.** By default, "the accounts are not linked automatically," and sign-in fails with `OAuthAccountNotLinked`. The opt-in `allowDangerousEmailAccountLinking` links on email match alone. The source does not check `email_verified`, and it creates OAuth users with `emailVerified: null`. The rule from issue #12 would need a custom `signIn` callback and your own provider profile handling. Sources: [Auth.js provider options](https://authjs.dev/reference/core/providers#allowdangerousemailaccountlinking), [handle-login.ts](https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/lib/actions/callback/handle-login.ts).

### Postgres adapter and tables

**Better Auth.** Adapters for Drizzle, Prisma, Kysely, and a native Postgres adapter. The core tables are `user`, `session`, `account` and `verification`. `npx auth@latest generate` writes the Drizzle or Prisma schema, and `npx auth@latest migrate` applies it for Kysely. Sessions live in the database by default. `session.cookieCache` can cache the session in a signed cookie for a short time to save queries. Sources: [Better Auth database](https://www.better-auth.com/docs/concepts/database), [Drizzle adapter](https://www.better-auth.com/docs/adapters/drizzle), [session management](https://www.better-auth.com/docs/concepts/session-management).

**Auth.js.** `@auth/drizzle-adapter` 1.11.3 (2026-07-20) and a Prisma adapter. Tables: `users`, `accounts`, `sessions` (only for database sessions), `verificationTokens` (only for magic links), and `authenticators` (only for passkeys). Source: [Auth.js Drizzle adapter](https://authjs.dev/getting-started/adapters/drizzle).

### Roles and Permissions

The model in issue #12: one Permission per protected Project, Roles that the Admin creates at run time in the panel, Users that hold Roles, one Admin set by `ADMIN_EMAIL` who is not a Role, plus Access Requests and per-User daily Run limits.

**Better Auth `admin` plugin.** It adds `role`, `banned`, `banReason` and `banExpires` to `user`, and `impersonatedBy` to `session`. `createAccessControl` defines Permissions, but roles "must be configured when setting up the plugin," so they are static in code. A User's roles are one comma-separated string. `adminUserIds` marks admins by user ID, not by email. Source: [Better Auth admin plugin](https://www.better-auth.com/docs/plugins/admin).

**Better Auth `organization` plugin.** With `dynamicAccessControl`, "you can create roles at runtime for organizations" in an `organizationRole` table. It is scoped to organizations and adds `organization`, `member` and `invitation` tables. The site has no organizations, so this adds a concept that `CONTEXT.md` does not have. Source: [Better Auth organization plugin](https://www.better-auth.com/docs/plugins/organization).

**Auth.js** has no role system. "Determining the users role is your responsibility." Source: [Auth.js RBAC guide](https://authjs.dev/guides/role-based-access-control).

**Conclusion.** No built-in plugin fits. Write five small Drizzle tables next to the auth tables: `role`, `role_permission`, `user_role`, `access_request`, and `run` (with a per-User daily limit column or table). Check the Admin with `session.user.email === process.env.ADMIN_EMAIL` and `session.user.emailVerified`. This is the same work with either library.

## Postgres hosts

| | Neon (own account) | Netlify Database | Supabase Postgres |
|---|---|---|---|
| Free storage | 0.5 GB per project, writes blocked above it | 5 GB max | 500 MB database |
| Free compute | 100 CU-hours per project per month, up to 2 CU | 48 compute units per period, 1 CU max | Shared CPU, 500 MB RAM |
| Idle behavior | Scales to zero after 5 min | Sleeps after 5 min | **Paused after 1 week of inactivity** |
| Free egress | 5 GB per project | 5 GB bandwidth, 5 GB written | 5 GB, plus 5 GB cached |
| Other free limits | 100 projects, 10 branches, 6 h restore window | 3 databases, 20 branches | 2 active projects, no automatic backups |
| Paid entry | Launch, usage based ($0.106 per CU-hour, $0.35 per GB-month), no minimum | Netlify credits (10 per compute unit, 20 per GB bandwidth) | Pro $25 per month |
| Works on Vercel | Yes. Vercel Marketplace native integration, or a plain `DATABASE_URL` | No documented use outside Netlify | Yes. Standard connection string |

Sources: [Neon pricing](https://neon.com/pricing), [Netlify Database billing and limits](https://docs.netlify.com/build/data-and-storage/netlify-database/billing-and-usage/), [Supabase pricing](https://supabase.com/pricing), [Neon and Vercel](https://neon.com/docs/guides/vercel-overview).

### Serverless connections

- **Neon.** The `@neondatabase/serverless` driver has two modes. HTTP (`neon()`) is "faster for single, non-interactive transactions" and supports non-interactive `transaction()`. WebSocket (`Pool`, `Client`) gives interactive transactions and `node-postgres` compatibility, but it "must be connected, used and closed within a single request handler." A `-pooler` host gives PgBouncer in transaction mode with up to 10,000 client connections. Use the direct host for migrations. Sources: [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver), [Neon connection pooling](https://neon.com/docs/connect/connection-pooling).
- **Netlify Database.** `@netlify/database` picks a connector for Netlify Functions, Edge Functions, and builds. `getConnectionString()` gives a raw string for Drizzle or `pg`. Migrations live in `netlify/database/migrations/` and run during the deploy. `netlify dev` starts a local Postgres. Sources: [Netlify Database API](https://docs.netlify.com/build/data-and-storage/netlify-database/api/), [Netlify Database getting started](https://docs.netlify.com/build/data-and-storage/netlify-database/getting-started/).
- **Supabase.** Direct connections use IPv6 unless you buy the IPv4 add-on. For serverless functions, use the Supavisor pooler in transaction mode on port 6543. "Transaction mode does not support prepared statements," so turn them off in the driver. Source: [Supabase connecting to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres).

### Netlify Database and the old "Netlify DB"

Netlify Database became generally available in April 2026 as "a native Netlify primitive" with no extension. It is only for credit-based plans. Storage was free until 2026-07-01, and Netlify said storage rates would follow. Databases from the beta, which used the Neon extension and `NETLIFY_DATABASE_URL`, still work, and a move is optional. Neon announced that it powers Netlify DB, but the current Netlify docs do not name the provider. Sources: [Netlify changelog, 2026-04-28](https://www.netlify.com/changelog/2026-04-28-netlify-database/), [Netlify Database overview](https://docs.netlify.com/build/data-and-storage/netlify-database/), [Switch to Netlify Database](https://docs.netlify.com/build/data-and-storage/netlify-database/switch-to-netlify-database/), [Neon blog](https://neon.com/blog/netlify-db-powered-by-neon).

The limit for this site is portability. The docs describe no use outside Netlify. A move to Vercel would mean a data move as well as a code change.

## Local development

The whole stack runs on Jered's machine with real OAuth apps.

- **Callback URLs.** Better Auth mounts at `/api/auth/[...all]`. The callbacks are `http://localhost:3000/api/auth/callback/google` and `http://localhost:3000/api/auth/callback/github`, plus the same paths on `https://jeredleisey.com`. Sources: [Better Auth Google](https://www.better-auth.com/docs/authentication/google), [Better Auth GitHub](https://www.better-auth.com/docs/authentication/github).
- **Google** allows several authorized redirect URIs in one client. HTTPS is required "except localhost." Matches are exact, including the trailing slash. Source: [Google OAuth for web server apps](https://developers.google.com/identity/protocols/oauth2/web-server).
- **GitHub** OAuth apps now accept "up to 10 callback URLs," so one app can hold both. Two apps (one for dev, one for production) are still a good way to keep production secrets off the laptop. Source: [Creating an OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app).
- **Database.** Use a Neon branch per environment (10 branches on the free plan), or a local Postgres in Docker. The Netlify Database option gives a local Postgres through `netlify dev`.
- **Environment.** `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, the Google and GitHub client IDs and secrets, `DATABASE_URL`, and `ADMIN_EMAIL`, in `.env.local`.

## Recommendation

**Better Auth 1.7 with the Drizzle adapter, on a Neon project in your own Neon account.**

1. **Better Auth over Auth.js.** Auth.js v5 is still beta after years. Its maintainers now tell new projects to use Better Auth. Better Auth enforces the linking rule from issue #12 by default and checks both sides. With Auth.js, you would write that security code yourself.
2. **Neon over Netlify Database.** The Neon driver and the `DATABASE_URL` work the same on Netlify, on Vercel, and on a laptop. Netlify Database is attractive for its branch per deploy preview, but it ties the data to Netlify. Its storage price after 2026-07-01 was not published when this was checked.
3. **Neon over Supabase.** The Supabase free plan pauses after a week without traffic, which is likely for a personal site. The site would also pay for an auth product and a storage product that it does not use.
4. **Driver.** Use `drizzle-orm/neon-serverless` (WebSocket `Pool`) for the auth adapter, because Better Auth wraps some writes in transactions. Use the HTTP driver for simple reads if you want. Open one pool per request, as the Neon docs say.
5. **Proxy.** Use `getSessionCookie()` in `proxy.ts` to redirect a Visitor to sign-in. Do not import the database there, because of the two open Netlify adapter bugs. Check the session, the Permission, and the daily Run limit on the server in each Project page, each admin page, and each Run route handler.
6. **RBAC.** Do not use the `admin` or `organization` plugins. Own the five tables named above.

## Open questions

- **Better Auth transactions on Neon HTTP.** The Drizzle adapter page did not say how transactions behave with `drizzle-orm/neon-http`. This document avoids the question by using the WebSocket driver. Test it early.
- **Netlify adapter and the proxy.** Issues #3562 and #3560 were still open on 2026-09-26. A cookie-only `proxy.ts` avoids the ESM case, but a quick deploy preview should confirm that the bundle builds.
- **Netlify Database storage price** after 2026-07-01 is not in the docs yet.
- **GitHub email privacy.** A User who keeps no verified email on GitHub will get `email_not_found` and cannot sign in with GitHub. That matches issue #12, but the sign-in page should explain it.
