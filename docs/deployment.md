# Deployment

How jeredleisey.com runs in production. Decided in the go-live grilling on 2026-09-27 (map #22) and in #20.

## Hosting

- **Vercel Hobby**, project `jeredleisey` under Jered's personal account. The site is non-commercial, which Hobby requires. If the site ever advertises paid work, revisit the plan (#20).
- The GitHub repo is connected. Every push to `main` deploys to production. Every PR gets a preview deployment.
- **Previews get no environment variables.** They are for visual checks. Sign-in and Jev do not work in them, because OAuth needs fixed callback addresses.
- The build needs no secrets. The database and auth start on first use.

## Domain and DNS

- The registrar is **Squarespace Domains** (renewal due 2027-07-06).
- DNS is **Vercel DNS** (nameservers `ns1.vercel-dns.com` and `ns2.vercel-dns.com`). Vercel manages the records and the certificates.
- `jeredleisey.com` is the main address. `www.jeredleisey.com` redirects to it with a 308.
- The Resend records for `notifications@jeredleisey.com` (DKIM and SPF) are in Vercel DNS.

## Database

- Neon, in Jered's own Neon project. Production uses its own database, `production`, on the `main` branch. Local development uses a different database, so local test data never reaches production.
- **Migrations run by hand**, before the deploy that needs them. In the repo, with the direct (unpooled) production connection string:

  ```sh
  DATABASE_URL_UNPOOLED='<direct production string>' npm run db:migrate
  ```

  A variable set in front of the command wins over `.env.local`.

## Environment variables (production)

Set with `vercel env add <NAME> production`. `vercel env ls production` lists the names.

| Name | Purpose |
|---|---|
| `DATABASE_URL` | Neon pooled connection to the `production` database |
| `BETTER_AUTH_SECRET` | Signs sessions. Production has its own value. |
| `BETTER_AUTH_URL` | `https://jeredleisey.com` |
| `ADMIN_EMAIL` | The one Admin. Also receives the Access Request emails. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | The same Google client as local development, with the production redirect URI added |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | A GitHub OAuth app for production only. GitHub allows one callback address per app. |
| `OPENROUTER_API_KEY` | A key for production only, with its own credit limit |
| `RESEND_API_KEY` | Added by the Resend integration from the Vercel Marketplace |

## Sign-in callbacks

- Google: `https://jeredleisey.com/api/auth/callback/google`. The consent screen is published, so anyone with a Google account can sign in.
- GitHub: `https://jeredleisey.com/api/auth/callback/github`.

## Before each release

Run the manual checklist in `docs/release-checklist.md`. Browser tests come after the relaunch (#20).
