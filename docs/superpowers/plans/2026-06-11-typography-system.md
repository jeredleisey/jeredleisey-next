# Typography System Implementation Plan

> Executed in-session by the controller (coupled, visual CSS changes — verified by running the app, not blind subagents). Spec: `docs/superpowers/specs/2026-06-11-typography-system-design.md`.

**Goal:** Neue Montreal (sans) for structure, Newsreader (serif) for long-form reading, with real weight hierarchy, an editorial reading scale, and a single shared prose definition.

**Tech:** Next.js 16, Tailwind v3 + @tailwindcss/typography, self-hosted woff2/otf via `@font-face`.

---

## Task 1 — Font loading (`app/globals.css`)
- Replace the single Thin `@font-face` with the Neue Montreal cuts in use: **Light→300, Regular→400, Semibold→600**, plus **Regular Italic→400 italic** (files already in `fonts/`: `PPNeueMontreal-Light.otf`, `-Regular.otf`, `-Semibold.otf`, `-Italic.otf`).
- Add two **Newsreader** `@font-face` rules using the variable woff2 with a weight **range**:
  ```css
  @font-face{font-family:Newsreader;src:url('../fonts/Newsreader.woff2') format('woff2');font-weight:200 700;font-style:normal;font-display:swap;}
  @font-face{font-family:Newsreader;src:url('../fonts/Newsreader-Italic.woff2') format('woff2');font-weight:200 700;font-style:italic;font-display:swap;}
  ```
- Commit the four Newsreader-related font assets (`fonts/Newsreader.woff2`, `fonts/Newsreader-Italic.woff2`) with this task. (The full Neue Montreal family is already added.)
- **Verify early:** start dev server, render Newsreader at 400 vs 600, confirm 600 is heavier. If not variable → fetch static Newsreader-600 instances and declare 600 explicitly.

## Task 2 — Tailwind families (`tailwind.config.ts`)
- Keep `neue-montreal` alias; add `sans: ['Neue-Montreal','system-ui','sans-serif']` and `serif: ['Newsreader','Georgia','serif']` under `fontFamily`.

## Task 3 — Shared editorial prose (`lib/proseClasses.ts` + 3 pages)
- Create `lib/proseClasses.ts` exporting one `proseClasses` string:
  - `prose prose-lg max-w-[68ch] font-serif`
  - headings sans + semibold: `prose-headings:font-neue-montreal prose-headings:font-semibold prose-headings:text-my-espresso dark:prose-headings:text-my-cream`
  - body: `prose-p:text-my-walnut dark:prose-p:text-my-stone prose-p:leading-[1.7] prose-li:text-my-walnut dark:prose-li:text-my-stone`
  - `prose-strong:text-my-espresso dark:prose-strong:text-my-cream prose-strong:font-semibold`
  - links: `prose-a:text-my-orange prose-a:no-underline hover:prose-a:text-my-espresso dark:hover:prose-a:text-my-cream`
  - code stays monospace (not serif): `prose-code:font-mono prose-code:text-my-amber prose-code:bg-my-stone/20 dark:prose-code:bg-my-espresso/50 prose-code:px-1 prose-code:rounded prose-pre:font-mono prose-pre:bg-my-stone/20 dark:prose-pre:bg-my-espresso/50 prose-pre:border prose-pre:border-my-stone/30 dark:prose-pre:border-my-espresso/30`
- Replace the inline prose class string in `app/writing/[essay]/page.tsx`, `app/learn/[series]/[lesson]/page.tsx`, `app/projects/[project]/page.tsx` with `className={proseClasses}`.

## Task 4 — Dialogue components → serif body
- `components/Dialogue/Turn.tsx` body div: add `font-serif`, bump to `text-[18px] leading-[1.7]` (keep strong→semibold, em→italic). Speaker label span stays sans.
- `components/Dialogue/Preface.tsx` & `Afterword.tsx`: body `<div>` → add `font-serif`; the "Preface"/"Afterword" eyebrows stay sans.
- `Note.tsx` stays sans (small marginalia/caption).

## Task 5 — Weight normalization
- `app/dialogues/page.tsx:40` `font-medium` → `font-semibold` (no 500 cut; render a real Semibold).

## Task 6 — Verify & push
- `npm test` (35 pass), `npm run build`.
- Run the app; confirm on essay, lesson, project, dialogue: serif body, sans headings/nav/labels, real weight hierarchy (no hairline body), italics + bold in prose, ~66ch measure. Light + dark + narrow viewport. Capture screenshots.
- Code review the diff, fix findings.
- Push branch, open PR for the Netlify preview.
