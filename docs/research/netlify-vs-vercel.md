# Netlify or Vercel for the relaunched site

Research for issue #18. Facts checked on 2026-09-26 against official docs, pricing pages, and GitHub releases.

## Scope

The site runs Next.js 16.2.4 and React 19 on Netlify with `@netlify/plugin-nextjs` (see `netlify.toml`). The relaunch adds Google and GitHub sign-in, a Postgres database, and server-side calls to OpenRouter that can take several seconds. This note compares the Netlify free plan and the Vercel Hobby plan for that workload. It also names the first paid step on each host.

## Summary table

| Topic | Netlify (Free, credit-based) | Vercel (Hobby) |
| --- | --- | --- |
| Next.js integration | OpenNext adapter `@netlify/plugin-nextjs`. Not a verified adapter. Next.js says Netlify is "working on" one. [1][2] | Verified adapter. Next.js team tests it before major releases. [2] |
| Latest adapter or platform release | v5.16.0 on 2026-09-17. Next.js latest is v16.3.6 on 2026-09-22. [3][4] | Built in. No separate adapter to update. [5] |
| Public compatibility report | Last run on Next.js v15.2.4, dated 2025-03-26, 97.0% pass. [6] | Not published. Next.js says results are "coming soon". [2] |
| Sync function timeout | 60 s, not configurable. [7] | 300 s default and maximum. [8] |
| Long work | Background functions, 15 min. [7] | Up to 300 s on Hobby. 800 s on Pro. [8] |
| Memory | 1024 MB. Configurable only on Pro and Enterprise. [7] | 2 GB / 1 vCPU. [8] |
| Cold starts | No documented mitigation found. | Fluid compute: bytecode caching and pre-warming on production, instance reuse. On by default for new projects. [9] |
| Postgres | Netlify Database. A branch per deploy preview. Free: 3 databases, 5 GB, 48 compute units per month. [10][11] | Neon through the Marketplace. A branch per preview deploy when you link a Neon account. [12] |
| Env vars per context | Production, deploy previews, branch deploys, named branches, local dev. Scopes (builds, functions) are Pro only. [13] | Production, Preview, Development, per Git branch overrides. [14] |
| Private previews, free plan | Private project: Team Owner only. Password protection is Pro only. [15] | Vercel Authentication. Owner plus 1 external user and 1 shareable link on Hobby. [16][17][18] |
| Password on previews | Pro, $20 per month. [15][19] | Pro ($20 per month) plus $20 per month per project. Not on Hobby. [16][20] |
| Free usage | 300 credits per month, hard limit. Site pauses at zero. [21] | Fixed monthly quotas. Features pause for 30 days when over. [18] |
| Commercial use on free plan | Allowed. [22] | Not allowed. Non-commercial personal use only. [23] |

## 1. Next.js 16 support

**Vercel.** Next.js lists two verified adapters: Vercel and Bun. A verified adapter is open source, runs the full Next.js compatibility test suite, and the Next.js team "coordinates testing with these platforms before major releases." [2] Vercel documents Cache Components, PPR, streaming, and middleware support on its Next.js page. [5]

**Netlify.** Next.js puts Netlify under "Other Platforms". These integrations "are not built on the public Adapter API and are not verified by the Next.js team, so feature support and compatibility may vary." It also says "Cloudflare and Netlify are working on verified adapters built on the Adapter API." [2]

Netlify's docs list full support for App Router, Server Components, route handlers, ISR, middleware, `after`, and Cache Components. Known limits: headers and redirects run after middleware, which differs from standalone Next.js. Node.js middleware does not support C++ addons or the filesystem API. [1] Netlify recommends that you do not pin the adapter, because it updates on each build. [1]

Adapter history around Next.js 16 (from the GitHub releases, [3]):

- Next.js 16.0.0 shipped on 2025-10-22. [4]
- Node.js middleware support arrived in adapter v5.13.0 on 2025-09-03. Before that, v5.12.1 failed the build when a site used Node.js middleware. In Next.js 16, `proxy.ts` replaces `middleware.ts` and runs on Node.js, so this matters for this repo.
- v5.14.3 on 2025-10-21 added `skipProxyUrlNormalize`. v5.14.4 on 2025-10-27 fixed "incorrect output path of middleware nft for Next.js 16".
- v5.15.2 on 2025-12-15 added compatibility for a 16.1 canary. v5.15.4 on 2026-01-05 fixed PPR shells on Next.js 16.1.0 and later.
- v5.15.9 on 2026-03-10 worked around bundling issues for Node.js middleware and proxy.

So the adapter did support Next.js 16 on launch day, then shipped proxy fixes for about five months.

Open issues on the adapter today that touch this stack:

- #3573, opened 2026-09-15: on Next.js 16.3.4, "RSC prefetch requests multiply on each reload and eventually enter an infinite loop." [24]
- #3560, opened 2026-08-21: "Node.js middleware 500s with ESM-only serverExternalPackages." [25] Auth and database libraries often ship ESM only and run in `proxy.ts`.
- #3504, opened 2026-05-04: the Image CDN returns 400 to any request with an `Authorization` header, which "breaks password-protected deploys." [26]

The public end-to-end report that Netlify links from its docs was last run against Next.js v15.2.4 on 2025-03-26. [6] No current public test result exists for either host.

## 2. Server functions

OpenRouter calls that take several seconds fit on both hosts.

**Netlify.** The synchronous limit is 60 seconds and it is not configurable. Streamed responses also stop at 60 seconds. Background functions run up to 15 minutes. Default memory is 1024 MB. Memory is configurable only on Pro and Enterprise. Buffered payloads stop at 6 MB. Default region is `cmh` (Ohio). [7][27] For framework functions such as the Next.js server handler, you set the region in the project UI, not in code. [7]

**Vercel.** With Fluid compute, Hobby functions get 300 seconds default and maximum. Pro raises the maximum to 800 seconds. Memory on Hobby is 2 GB with 1 vCPU. Payloads stop at 4.5 MB. Default region is `iad1`. [8] Fluid compute reduces cold starts with bytecode caching and pre-warming on production deploys. It also lets one instance serve several requests at once, which Vercel says suits I/O-bound AI calls. It is on by default for new projects since 2025-04-23. [9] Time spent waiting on I/O, such as an AI model call, does not count toward Active CPU. [8]

Netlify does not document a cold start figure or mitigation on the pages checked. Neither host publishes a cold start number.

## 3. Postgres and secrets

**Netlify.** Netlify Database is a managed Postgres built into the platform. "Deploy previews get their own database branch, with a copy of the production data." It is available on credit-based plans only and it spends credits for compute and bandwidth. [10] Free plan limits: 3 databases, 5 GB each, 1 max compute unit, 48 compute units per month, 5 GB bandwidth per month. [11] The billing page says storage is free "until July 1, 2026" and will be billed "no earlier than that date." That date is past and the page shows no storage rate. [11]

**Vercel.** Neon installs from the Vercel Marketplace. With "Create New Neon Account", Vercel manages billing. With "Link Existing Neon Account", the integration creates "a database branch for each preview deployment." [12] Marketplace integrations add their env vars to the environments on the project connection. [14]

A standalone Neon (or other Postgres) account works on either host with a `DATABASE_URL` env var. That keeps the database portable.

**Env vars.** Netlify supports Production, Deploy Previews, Branch deploys, specific branches (with wildcards), and local dev. Limiting a variable to builds or functions needs Pro. [13] Vercel supports Production, Preview, Development, and branch-specific Preview overrides on all plans, with 64 KB per deploy. [14]

**Sign-in callbacks.** Google and GitHub OAuth need fixed callback URLs. Preview URLs change on both hosts, so plan to test sign-in on one stable branch URL or on production. This is the same on both hosts.

## 4. Preview deploys only chosen people can open

**Netlify.** On credit-based Free and Personal plans, "private projects can only be seen by the Team Owner." Password protection is "only available on Pro." [15] Pro costs $20 per month and adds unlimited team members who can view. [15][19] Open issue #3504 reports that the Image CDN breaks password-protected deploys. [26]

**Vercel.** Hobby includes Vercel Authentication for preview and production deploys. [18] A visitor must log in to Vercel and have access. [17] On Hobby, "those on the Hobby plan can only have one external user per account," and "developers on the hobby plan can only create one shareable link in total per account." [17][16] Password Protection is not on Hobby. On Pro it costs $20 per month per protected project, on top of the $20 Pro seat. [20][28]

Neither free plan lets several chosen people open previews. Vercel Hobby lets one extra person in, plus one shareable link.

## 5. Cost and terms

**Netlify Free.** 300 credits per month with a hard limit. At zero, "all of your web projects (sites/apps) are paused" and show "Site not available." You cannot buy more credits on Free. [21] A successful production deploy costs 15 credits. Deploy previews, branch deploys, and failed deploys cost 0. Compute is 10 credits per GB-hour, bandwidth 20 credits per GB, and web requests 2 credits per 10,000. [21] So 20 production deploys in one month use the whole free allowance before any traffic. Personal is $9 per month for 1,000 credits and allows extra credit purchases. [19][21] Netlify says: "On the Free plan, you can deploy commercial projects, personal sites, or other creative explorations." [22]

**Vercel Hobby.** Free. Monthly quotas include 100 GB Fast Data Transfer, 1,000,000 edge requests, 1,000,000 function invocations, 4 hours Active CPU, and 360 GB-hours provisioned memory. [18] Over quota, "you will have to wait until 30 days have passed before you can use the feature again." Hobby cannot buy more usage. [18][28] Hobby allows 100 deploys per day. [18]

Hobby is "restricted to non-commercial personal use only." Commercial use includes "Advertising the sale of a product or service" and ads such as AdSense. Donations are allowed. [23] A personal site that does not sell or advertise a service fits. A site that markets paid consulting may not. Vercel says to contact support when unsure. [23]

## 6. Effort to move

The repo change is small:

- Delete `netlify.toml` and remove `@netlify/plugin-nextjs` from `devDependencies`.
- Import the GitHub repo in Vercel. Vercel detects Next.js with no config. [5]
- Copy env vars into Production, Preview, and Development.
- Keep the GitHub Actions workflow in `.github/workflows/ci.yml` as is. It runs lint, test, and build and does not deploy.

The domain change is small:

- `jeredleisey.com` uses Netlify DNS today (NS1 nameservers `dns1.p05.nsone.net` to `dns4`). The domain has no MX or TXT records.
- Vercel needs an A record for the apex and a CNAME for `www`, or a move to Vercel nameservers. [29] Vercel warns to copy existing records first, including MX and TXT. [29]
- Update the Google and GitHub OAuth callback URLs if the host name changes.

If you stay on Netlify, no move is needed, but the next Next.js upgrade depends on the adapter keeping up.

## Recommendation

Move to Vercel Hobby before the relaunch, if the site stays non-commercial.

Reasons:

1. Vercel is a verified Next.js adapter. Netlify is not yet, and it has open bugs on Next.js 16.3 and on Node.js `proxy.ts`, which is where sign-in checks run.
2. The relaunch adds sign-in, a database, and AI calls. That is new server code either way, so the move costs the least now.
3. Vercel Hobby gives 300 second functions, Fluid compute cold start mitigation, and 2 GB memory. Netlify Free gives 60 seconds and 1 GB.
4. Vercel Hobby lets one outside person see protected previews. Netlify Free lets only the owner in.
5. Netlify Free pauses the whole site at 300 credits, and each production deploy costs 15.

Stay on Netlify, or budget for Vercel Pro at $20 per month, if the site will sell or advertise a paid service. Vercel Hobby terms forbid that. Netlify Free allows it.

Use a standalone Neon account (or the Neon Marketplace integration linked to your own Neon account) instead of Netlify Database or a Vercel-billed database. That keeps the database portable between hosts.

## Open questions

- Is the Netlify account on a credit-based plan or a legacy plan? The limits above assume credit-based. Legacy plans have different rules. [15]
- Will the site promote paid work? That decides whether Vercel Hobby is allowed.
- Netlify Database storage pricing after 2026-07-01 is not published. [11]
- Neither host publishes current Next.js test results. Next.js says they are "coming soon." [2]
- No primary source gives cold start times for either host.

## Sources

1. Netlify, Next.js on Netlify: https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/
2. Next.js docs (v16.3.6), Deploying: https://nextjs.org/docs/app/getting-started/deploying
3. opennextjs-netlify releases: https://github.com/opennextjs/opennextjs-netlify/releases
4. Next.js releases (v16.0.0 and v16.3.6): https://github.com/vercel/next.js/releases
5. Vercel, Next.js on Vercel: https://vercel.com/docs/frameworks/full-stack/nextjs
6. Netlify Next.js runtime e2e report: https://runtime-e2e-report.netlify.app/
7. Netlify, Functions configuration: https://docs.netlify.com/build/functions/configuration/
8. Vercel, Functions limits: https://vercel.com/docs/functions/limitations
9. Vercel, Fluid compute: https://vercel.com/docs/fluid-compute
10. Netlify Database overview: https://docs.netlify.com/build/data-and-storage/netlify-db/
11. Netlify Database billing and limits: https://docs.netlify.com/build/data-and-storage/netlify-database/billing-and-usage/
12. Vercel Marketplace, Neon: https://vercel.com/marketplace/neon
13. Netlify, Environment variables: https://docs.netlify.com/build/environment-variables/overview/
14. Vercel, Environment variables: https://vercel.com/docs/environment-variables
15. Netlify, Project visibility: https://docs.netlify.com/manage/security/secure-access-to-sites/project-visibility/
16. Vercel, Shareable links: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/sharable-links
17. Vercel, Vercel Authentication: https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication
18. Vercel, Hobby plan: https://vercel.com/docs/plans/hobby
19. Netlify pricing: https://www.netlify.com/pricing/
20. Vercel, Deployment Protection: https://vercel.com/docs/deployment-protection
21. Netlify, How credits work: https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/
22. Netlify blog, Introducing Netlify's Free plan: https://www.netlify.com/blog/introducing-netlify-free-plan/
23. Vercel, Fair use guidelines: https://vercel.com/docs/limits/fair-use-guidelines
24. opennextjs-netlify issue #3573: https://github.com/opennextjs/opennextjs-netlify/issues/3573
25. opennextjs-netlify issue #3560: https://github.com/opennextjs/opennextjs-netlify/issues/3560
26. opennextjs-netlify issue #3504: https://github.com/opennextjs/opennextjs-netlify/issues/3504
27. Netlify, Functions API reference (streaming limits): https://docs.netlify.com/build/functions/api/
28. Vercel pricing: https://vercel.com/pricing
29. Vercel, Add a custom domain: https://vercel.com/docs/domains/working-with-domains/add-a-domain
