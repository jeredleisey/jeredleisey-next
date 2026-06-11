# Typography System — Design Spec

**Date:** 2026-06-11
**Status:** Approved for planning
**Branch:** `feature/typography-system`

## Summary

Replace the site's single-cut typography (everything rendered in Neue Montreal *Thin*, a hairline display weight used as body text) with a real role-based type system: **Neue Montreal** (sans) for all structure — display, headings, navigation, labels, metadata — and **Newsreader** (serif) for all long-form reading — essays, dialogues, lessons, project writeups. Sans for structure, serif for prose: the classic editorial split. This fixes the core readability problem (a display weight pressed into body duty) and introduces weight hierarchy, a deliberate type scale, proper line-height, and a constrained reading measure.

## Goals

- Long-form reading is set in a text-optimized serif at a comfortable size, leading, and measure.
- Real weight hierarchy (the design language's "weight contrast over size contrast"), replacing Thin-everywhere.
- Headings/UI stay sans for crisp, modern structure against the serif body.
- Self-hosted fonts, consistent with the existing `@font-face` approach; fast and offline-safe (no runtime font CDN).

## Non-goals

- Not redesigning layout, color, spacing, or components beyond their type.
- Not changing index/listing/nav/sidebar text to serif — those are UI, they stay sans.
- Not adding a third typeface (Neue Montreal + Newsreader only).
- Serif headings (considered and rejected — sans headings preserve the industrial/modern edge).

## Typefaces

1. **Neue Montreal** (sans) — already self-hosted; full weight range now present in `fonts/` (Hairline, Thin, Light, Regular, Semibold, Extrabold + italics). Used for display, headings, UI, nav, labels, captions, metadata.
2. **Newsreader** (serif) — newly self-hosted as **two variable woff2 files** (`fonts/Newsreader.woff2` normal, `fonts/Newsreader-Italic.woff2` italic), latin subset, weight axis ~200–700 + optical-size axis. Used only for long-form reading body and emphasis.

## Role map

| Role | Font · weight | Size / leading | Treatment | Applied to |
|---|---|---|---|---|
| Display | Neue Montreal · Light (300) | 40–48px / 1.05 | tracking −0.02em | page/landing `<h1>`, dialogue & essay titles |
| Section head | Neue Montreal · Semibold (600) | 24px / 1.15 | −0.01em | MDX `h2` |
| Subhead | Neue Montreal · Semibold (600) | 20px / 1.2 | — | MDX `h3` |
| Body (reading) | Newsreader · Regular (400) | 18px / 1.65, ~66ch | serif; italics + bold (600) via the variable file | essay/lesson/project prose, dialogue turn bodies, preface, afterword |
| UI base | Neue Montreal · Regular (400) | 14px / 1.5 | — | nav, sidebar, list items |
| Label / eyebrow / meta | Neue Montreal · Semibold (600) | 11–12px | uppercase, 0.16em tracking | section eyebrows, dates, "unedited transcript" |

## Architecture / surfaces

### Font loading — `app/globals.css`
- Replace the single Thin `@font-face` with the Neue Montreal set we actually use: **Light → 300, Regular → 400, Semibold → 600**, plus **Regular Italic → 400 italic**. (Hairline/Thin/Extrabold files remain available but are not declared unless a use appears.)
- Add two Newsreader `@font-face` rules (normal + italic) using the variable woff2 with a weight **range** (`font-weight: 200 700;`) and `font-display: swap`. Optical sizing is automatic (`font-optical-sizing: auto`, the default).

### Tailwind — `tailwind.config.ts`
- `fontFamily.sans` (and keep the existing `neue-montreal` alias) → `['Neue-Montreal', 'system-ui', 'sans-serif']`.
- Add `fontFamily.serif` → `['Newsreader', 'Georgia', 'serif']`.

### Base default — `app/layout.tsx`
- Body stays **sans** (`font-neue-montreal`) — the site chrome is UI. Serif is applied only to reading surfaces (below).

### Reading surfaces (apply serif + editorial scale)
- The four content pages' `prose` blocks (`app/writing/[essay]/page.tsx`, `app/learn/[series]/[lesson]/page.tsx`, `app/projects/[project]/page.tsx`, and the dialogue page body): set the prose container to **serif** for body, keep **headings sans** (`prose-headings` → Neue Montreal), body ~18px / 1.65, constrain measure to ~66ch. The shared prose class string is currently duplicated across these pages — extract it into one shared constant (e.g. `lib/proseClasses.ts`) and import it, so the type system lives in one place.
- `components/Dialogue/Turn.tsx`, `Preface.tsx`, `Afterword.tsx`: body text → serif (Newsreader); speaker labels, the "Preface"/"Afterword"/"Note" eyebrows, and all meta stay sans.

### Weight cleanup
- Display/heading usages currently set to `font-light` resolve to the Thin file today; after the `@font-face` change, `font-light` (300) correctly maps to Neue Montreal **Light**. Audit the `font-light` usages: large display titles keep `font-light`; if any body-ish text used `font-light`, move it to the serif body treatment instead.
- The single `font-medium` (500) usage and the `font-semibold` (600) usages: ensure they map to declared cuts. With 400 and 600 declared (no 500 file), normalize `font-medium` → `font-semibold` where it's a label/active-state, so it renders a real cut rather than a synthesized weight.

## Verification

- **Variable-font check (must pass early):** render Newsreader at 400 vs 600 and confirm 600 is visibly heavier. If the woff2 turns out static (no weight axis), fetch static Newsreader 600 instances as a fallback and declare them explicitly.
- Build succeeds; existing tests still pass (35).
- Drive the running app: an essay, a lesson, a project, and the dialogue page render body in Newsreader serif; headings/nav/labels render in Neue Montreal sans; weights show real hierarchy (no hairline body); italics and bold render correctly in prose. Check light **and** dark, and a narrow viewport.
- No layout breakage from the measure constraint or size changes.

## Open questions

None blocking. Optical-size axis behavior and the variable-weight assumption are verified at render time per above.
