# MDX renderer: is next-mdx-remote still sound for Next 16 and React 19?

Research for issue #19. Facts checked on 2026-09-26 against primary sources.

## Question

The site reads `.mdx` files from `content/` with `gray-matter` (see `lib/content.ts`). Four pages
render the body with `MDXRemote` from `next-mdx-remote/rsc` v5:

- `app/dialogues/[dialogue]/page.tsx` (passes the custom `Turn`, `Note`, `Preface` and `Afterword`
  components from `components/Dialogue`)
- `app/learn/[series]/[lesson]/page.tsx`
- `app/projects/[project]/page.tsx`
- `app/writing/[essay]/page.tsx`

Is this setup still sound for Next 16.2.4 and React 19.2.4? What are the alternatives, and what
does a move cost?

## Short answer

No. `next-mdx-remote` is archived and gets no more fixes. The version this repo installs (5.0.0)
has a high-severity advisory. Move to `next-mdx-remote-client` v2. For this repo the move is a
change of one dependency and four import lines. A trial build of that change gave the same HTML
as the current build.

## 1. Status of next-mdx-remote

| Fact | Source |
| --- | --- |
| The GitHub repository is archived (read-only). | [GitHub API: hashicorp/next-mdx-remote](https://api.github.com/repos/hashicorp/next-mdx-remote) (`"archived": true`) |
| The README starts with "This project is archived and is no longer supported". The notice was added on 2026-02-27. | [README](https://github.com/hashicorp/next-mdx-remote#readme), [commit 69fdfdc](https://github.com/hashicorp/next-mdx-remote/commit/69fdfdc4) |
| The last release is v6.0.0, published 2026-02-12. Before that, v5.0.0 on 2024-05-22. No release came between them. | [Releases](https://github.com/hashicorp/next-mdx-remote/releases), [npm](https://www.npmjs.com/package/next-mdx-remote?activeTab=versions) |
| CVE-2026-0969 (GHSA-g4xw-jxrg-5f6m), severity high, CVSS 8.8: arbitrary code execution when the package compiles untrusted MDX. Affected: `>= 4.3.0, < 6.0.0`. Fixed in 6.0.0. | [GitHub advisory](https://github.com/advisories/GHSA-g4xw-jxrg-5f6m), [HCSEC-2026-01](https://discuss.hashicorp.com/t/hcsec-2026-01-arbitrary-code-execution-in-react-server-side-rendering-of-untrusted-mdx-content/77155) |
| v6.0.0 adds `blockJS` and `blockDangerousJS`. Both default to `true`, so v6 removes JavaScript expressions such as `{variable}` from MDX unless you turn this off. | [v6.0.0 release notes](https://github.com/hashicorp/next-mdx-remote/releases/tag/v6.0.0), [README section](https://github.com/hashicorp/next-mdx-remote?tab=readme-ov-file#javascript-expressions-in-mdx) |
| This repo locks `next-mdx-remote` 5.0.0. `npm audit --omit=dev` reports the advisory above, and says the fix is 6.0.0, a major version. | `package-lock.json`, local `npm audit` run on 2026-09-26 |
| Open issues remain with no fix: #462 (`@types/mdx` and React 19 types) and #488 (RSC mode fails on Next 15.2). Both are open and the repository cannot take new fixes. | [#462](https://github.com/hashicorp/next-mdx-remote/issues/462), [#488](https://github.com/hashicorp/next-mdx-remote/issues/488) |

**Risk for this site.** The content is local and written by the site owner, so the RCE path needs
an attacker who can already write to the repository. The practical risk is low. But the advisory
will stay in every `npm audit` and Dependabot report, and a future Next or React change will get
no fix in this package.

**Does v5 work today?** Yes. The current build on Next 16.2.4 and React 19.2.4 passes, and issue
#488 does not show here.

## 2. What the Next.js docs say now

| Fact | Source |
| --- | --- |
| The current MDX guide (docs version 16.3.6, last updated 2026-08-25) covers only `@next/mdx`. It has no "Remote MDX" section and names no remote MDX package. | [nextjs.org/docs/app/guides/mdx](https://nextjs.org/docs/app/guides/mdx) |
| The guide had a "Remote MDX" section that recommended `next-mdx-remote-client`, with a warning that MDX runs on the server and can lead to RCE. Commit #89709 removed that section on 2026-02-09. | [vercel/next.js commit d6d84be](https://github.com/vercel/next.js/commit/d6d84be211) |
| `@next/mdx` does not support frontmatter by default. The guide points to `remark-frontmatter`, `remark-mdx-frontmatter` or `gray-matter`, or to `export const metadata` in the MDX file. | [MDX guide, Frontmatter](https://nextjs.org/docs/app/guides/mdx#frontmatter) |
| With Turbopack, remark and rehype plugins must be given by name as strings. Plugins with options that are not serializable do not work yet. | [MDX guide, Using Plugins with Turbopack](https://nextjs.org/docs/app/guides/mdx#using-plugins-with-turbopack) |
| `@next/mdx` needs an `mdx-components.tsx` file at the project root to work with the App Router. | [MDX guide](https://nextjs.org/docs/app/guides/mdx#add-an-mdx-componentstsx-file) |

## 3. Alternatives

### next-mdx-remote-client (recommended)

| Fact | Source |
| --- | --- |
| A fork of `next-mdx-remote`, built on `@mdx-js/mdx`. Active: v2.1.12 released 2026-08-11, last push 2026-08-18, 3 open issues, not archived. | [GitHub](https://github.com/ipikuka/next-mdx-remote-client), [releases](https://github.com/ipikuka/next-mdx-remote-client/releases) |
| v2 is for React 19. Peer dependencies: `react >= 19.1.0`, `react-dom >= 19.1.0`. Engine: `node >= 20.9.0`. v1 is for React 18. | [npm](https://www.npmjs.com/package/next-mdx-remote-client), [README](https://github.com/ipikuka/next-mdx-remote-client#readme) |
| RSC: `MDXRemote` and `evaluate` from `next-mdx-remote-client/rsc`. The RSC `MDXRemote` takes `source`, `components` and `options`, the same shape this repo uses. | [README, app router](https://github.com/ipikuka/next-mdx-remote-client#the-part-associated-with-nextjs-app-router) |
| Frontmatter: `parseFrontmatter: true`, or `getFrontmatter` from `next-mdx-remote-client/utils` to read frontmatter without a compile. `gray-matter` can also stay as it is. | [README](https://github.com/ipikuka/next-mdx-remote-client#readme) |
| The project publishes a migration guide from `next-mdx-remote`. For RSC the change is the import path. | [migration_guide.md](https://github.com/ipikuka/next-mdx-remote-client/blob/main/migration_guide.md) |
| Security: it can turn off ESM (`import`/`export`) in MDX. It does **not** block JavaScript expressions by default. The README says to use `remark-mdx-remove-expressions` if the content is not trusted. The GitHub advisory database lists no advisory for this package. | [README, Security](https://github.com/ipikuka/next-mdx-remote-client#security), [advisory search](https://github.com/advisories?query=next-mdx-remote-client) |

**Effort for this repo: very low (under one hour).** Replace the dependency and change four
import lines from `next-mdx-remote/rsc` to `next-mdx-remote-client/rsc`. `lib/content.ts` and
`gray-matter` do not change.

### next-mdx-remote 6.0.0 (stay, but upgrade)

- It fixes the advisory. A trial build gave the same HTML as v5 (see section 4).
- The site content uses no JavaScript expressions outside code blocks, so `blockJS: true` removes
  nothing today.
- It is archived, so this is the last version. Any later break in Next or React stays broken.

**Effort: minimal.** One version bump. This is a short-term patch, not a lasting fix.

### @next/mdx (official)

| Fact | Source |
| --- | --- |
| v16.3.6, released with Next.js and kept in step with it. | [npm](https://www.npmjs.com/package/@next/mdx) |
| Compiles MDX at build time through the bundler. Works in Server Components. Components come from `mdx-components.tsx` or a `components` prop on the imported MDX. | [MDX guide](https://nextjs.org/docs/app/guides/mdx) |
| No frontmatter by default. Dynamic routes use `await import(\`@/content/${slug}.mdx\`)` with `generateStaticParams`. | [MDX guide, dynamic imports](https://nextjs.org/docs/app/guides/mdx#using-dynamic-imports) |

**Effort for this repo: medium (about one day).** Add `@next/mdx`, `@mdx-js/loader`,
`@mdx-js/react` and a `mdx-components.tsx` file. Change `next.config.ts`. Change the four pages
to import MDX modules by path. Frontmatter needs `remark-frontmatter` plus
`remark-mdx-frontmatter`, or `lib/content.ts` keeps `gray-matter` for the index pages while the
pages import the body. The dialogue page counts `<Turn` in the raw source, so it still needs the
raw text from `lib/content.ts`. The lesson filenames start with a number (`01-...`), so the
import path must map the slug back to the file name. The gain is no runtime compile and no
`new Function` call at render. For a site with 7 MDX files that gain is small.

### Content Collections

| Fact | Source |
| --- | --- |
| Active: `@content-collections/core` 0.15.3 (updated 2026-09-21), `@content-collections/next` 0.2.11 with peer `next ^12 ... ^16`. Still at 0.x. | [npm core](https://www.npmjs.com/package/@content-collections/core), [npm next](https://www.npmjs.com/package/@content-collections/next), [GitHub](https://github.com/sdorra/content-collections) |
| Frontmatter is parsed and checked against a schema (Zod in the docs). MDX is compiled in a `transform` step with `compileMDX`, and rendered with `MDXContent` from `@content-collections/mdx/react`. | [docs/content/mdx.mdx](https://github.com/sdorra/content-collections/blob/main/docs/content/mdx.mdx) |
| `@content-collections/mdx` was last updated 2025-03-10 (v0.2.2). | [npm](https://www.npmjs.com/package/@content-collections/mdx) |

**Effort for this repo: medium to high (one to two days).** It replaces `lib/content.ts` and
`lib/types.ts` with collection configs and generated types, and it adds a build step. The typed
frontmatter is a real gain, but it is a content-layer rewrite, not a renderer swap.

### Velite

| Fact | Source |
| --- | --- |
| Active: v0.4.0 released 2026-06-17, v1.0.0-alpha.3 on 2026-06-19, last push 2026-09-25. Still before 1.0. | [GitHub](https://github.com/zce/velite), [releases](https://github.com/zce/velite/releases) |
| `s.mdx()` gives a function-body string. You render it with `new Function(code)` in a small component, and pass custom components at render time. | [Using MDX](https://velite.js.org/guide/using-mdx) |
| The webpack plugin does not work with Turbopack. The docs say to start Velite from `next.config.mjs` instead. | [Integration with Next.js](https://velite.js.org/guide/with-nextjs) |

**Effort for this repo: medium to high (one to two days).** Same scope as Content Collections,
plus a pre-1.0 API that is changing and a Turbopack workaround.

### Others seen, not assessed in depth

- `fumadocs-mdx` 15.4.5 is active but is tied to the Fumadocs documentation framework
  (peer `fumadocs-core`). Too much for a personal site. [npm](https://www.npmjs.com/package/fumadocs-mdx)
- `contentlayer2` 0.5.8 has had no update since 2025-05-03. [npm](https://www.npmjs.com/package/contentlayer2)

## 4. Local trial (2026-09-26)

On branch `research/mdx-renderer`, with no change committed:

1. Baseline: `next-mdx-remote` 5.0.0. `npm run build` passes.
2. `next-mdx-remote` 6.0.0: build passes. The `<article>` or `<main>` markup of the 5 MDX pages is
   byte-identical to the baseline.
3. `next-mdx-remote-client` 2.1.12 with the four import lines changed: build (with type check)
   passes, 43 of 43 tests pass, lint is clean. The markup of the 5 MDX pages, including the
   dialogue with custom components, is byte-identical to the baseline.

## 5. Side finding

`npm audit` also flags `js-yaml` 3.14.2 under `gray-matter` 4.0.3 (GHSA-h67p-54hq-rp68,
quadratic DoS in merge keys, fixed in 3.15.0). `gray-matter` has had no release since 2023, but
its range `^3.13.1` accepts 3.15.0, so `npm audit fix` resolves it without a change of package.
[Advisory](https://github.com/advisories/GHSA-h67p-54hq-rp68), [npm gray-matter](https://www.npmjs.com/package/gray-matter)

## Recommendation

Before relaunch, replace `next-mdx-remote` with `next-mdx-remote-client` v2.

- It removes an archived dependency and the CVE-2026-0969 audit finding.
- It is maintained, it declares React 19 support, and Next.js docs recommended it until they
  dropped the section.
- For this repo it is a dependency swap plus four import lines, about one hour with a review.
  The trial build gave identical output.
- Keep `gray-matter` and `lib/content.ts` as they are. Run `npm audit fix` for `js-yaml`.
- Because this client does not block JavaScript expressions by default, keep the rule that MDX in
  `content/` comes only from the site owner. If content ever comes from other people, add
  `remark-mdx-remove-expressions` and turn off ESM.

Do not move to `@next/mdx`, Content Collections or Velite for this decision. Each one is a
content-layer rewrite of one to two days for a site with 7 MDX files, and none of them fixes a
problem that the client swap leaves open. Look at Content Collections again only if typed,
schema-checked frontmatter becomes a need.

## Open uncertainty

- The `next-mdx-remote-client` project has one main maintainer (154 of 155 commits by one
  person, per the [contributors API](https://api.github.com/repos/ipikuka/next-mdx-remote-client/contributors)).
  Its bus factor is low. The fallback is `@next/mdx`, which Vercel maintains.
- The Next.js docs removed their remote MDX section in February 2026. The commit does not say
  why, so it is not known whether Vercel still endorses `next-mdx-remote-client`.
