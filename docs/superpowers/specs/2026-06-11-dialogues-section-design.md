# Dialogues — Design Spec

**Date:** 2026-06-11
**Status:** Approved for planning
**Source material:** `docs/conversations/raw/anchor_to_the_wind.md`

## Summary

A new top-level section, **Dialogues**, for publishing unedited conversations with frontier AI models, optionally annotated in the author's own voice. It is a distinct *personal* pillar — explicitly not part of the site's teaching curriculum (Learn / Projects / Writing). The reading experience is an "industrial transcript": exposed structure, a speaker gutter, hairline rules between turns, and a single orange accent, consistent with the site's honest-materials design language.

## Goals

- Publish AI conversations as whole, unedited transcripts.
- Let the author add optional commentary in three forms: a framing **preface**, turn-level **margin annotations**, and a closing **reflection**.
- Treat the model used (e.g. Fable 5, Opus 4.8) as a first-class, headline fact.
- Grow gracefully as a collection over time.

## Non-goals

- Not a teaching/curriculum surface; no lesson cross-references.
- No inline interjections breaking into the dialogue (considered and dropped).
- No turn-number display in the transcript (considered and dropped — added noise).
- No "annotated/not" badge on the index (considered and dropped).
- No CMS; content stays as MDX files, consistent with the rest of the site.

## Positioning

Dialogues is the fourth top-level nav item alongside Learn / Projects / Writing in `components/GlobalNav.tsx`. The index page opens with framing copy that separates it from the teaching mission ("these aren't lessons — they're the record of thinking out loud with a machine that thinks back").

## Visual direction (validated via mockups)

**Single dialogue page**, top to bottom:

- **Header:** breadcrumb (`Dialogues`), title, and a meta line — `model · date · turn count · unedited transcript`. The `unedited transcript` tag is orange (the page's one accent up top, doubling as an honesty signal). Followed by a full-width espresso hairline rule.
- **Preface** (optional): an orange-ruled block (left border) before the transcript begins.
- **Transcript:** each turn is a 3-column grid — gutter / body / margin. The gutter holds the speaker tag (Fable's in orange, the human's in espresso) and is *sticky*, staying pinned beside long turns. Hairline `parchment` rules separate turns; the first turn has an espresso rule above it.
- **Margin annotations** (optional, per turn): right rail, tied to a specific turn, marked with an orange tick / left border. Markdown allowed inside.
- **Afterword** (optional): a `parchment`-filled block after the transcript, reading as the author stepping back out of the conversation.

**Index page:** a list of dialogues. Each entry: title (turns orange on hover) + one-line summary on the left; model name and date right-aligned. An intro paragraph frames the pillar.

**Palette/type:** existing tokens only — `cream #F4EFE6`, `parchment #EAE3D6`, `stone #C2B8A8`, `walnut #7A6E64`, `amber #CC922F`, `espresso #1C1714`, `orange #FF4F00`; Neue Montreal throughout.

## Architecture

Mirrors the existing Writing section pattern.

### Routes & files

- `app/dialogues/page.tsx` — index/listing.
- `app/dialogues/[dialogue]/page.tsx` — single dialogue; renders the header from frontmatter and the MDX body via `MDXRemote` with a custom `components` map.
- `components/DialoguesList.tsx` — secondary sidebar listing dialogue titles, wired into `components/Sidebar.tsx` via `inDialogues = pathname.startsWith('/dialogues')` (alongside the existing `inProjects` / `inWriting` checks).
- `components/Dialogue/` — render components: `Turn`, `Note`, `Preface`, `Afterword`.
- `lib/content.ts` — `getAllDialogues(contentDir?)` and `getDialogue(slug, contentDir?)`, following the `getAllEssays` / `getEssay` shape (read from `content/dialogues`, sort by date descending).
- `lib/types.ts` — `DialogueMetadata`, `DialogueSummary`, `DialoguePage`.

### Content model

Files at `content/dialogues/<slug>.mdx`. Frontmatter is metadata only:

```yaml
title: "Anchor to the Wind"
model: "Fable 5"
date: "2026-06-11"
summary: "A lifelong atheist and an AI move from the origins of religion to the problem of other minds…"
```

Body authored with four MDX components so notes live with the turns they annotate:

```mdx
<Preface>I asked an idle question before bed…</Preface>

<Turn who="Jered">My anchor is to the wind. See that as you will.</Turn>

<Turn who="Fable">
Anchoring to the wind is either a contradiction or the most honest answer…
<Note>It answered me before I'd finished the thought.</Note>
</Turn>

<Afterword>I came away unsettled in a good way…</Afterword>
```

Component behavior:

- **`Turn`** — renders the per-turn 3-column grid. Prop `who` is the display label. The human speaker (`who="Jered"`) gets the espresso tag; any other value is treated as the AI and gets the orange tag. Gutter is sticky.
- **`Note`** — optional, nested inside a `Turn`. Renders into that turn's right rail with the orange marker. Markdown allowed.
- **`Preface`** — optional, orange-ruled intro block. Markdown allowed.
- **`Afterword`** — optional, parchment closing block. Markdown allowed.

All three annotation types are opt-in per dialogue. A bare transcript (turns only) renders correctly with no preface, notes, or afterword.

### Responsive & theme

- Built with `dark:` variants, consistent with the rest of the site (mockups shown in light mode; the theme toggle applies here too).
- On mobile, the 3-column turn grid collapses to a single column; the gutter becomes an inline speaker label and `Note` blocks drop in directly beneath their turn as orange-ruled blocks.

## Authoring flow

Raw model exports are saved to `docs/conversations/raw/` (e.g. `anchor_to_the_wind.md`). Converting a raw `**Speaker:**` transcript into the `<Turn>`-based MDX is a mechanical transform performed at authoring time — the author does not hand-tag turns. The first conversion is `anchor_to_the_wind.md` → `content/dialogues/anchor-to-the-wind.mdx`. Preface, notes, and afterword for that first dialogue are authored by the author (placeholders from the mockup are illustrative only and must be replaced with real notes or omitted).

## Testing

Follow the existing `lib/content.ts` test pattern with a fixture content directory. Cover:

- `getAllDialogues` returns dialogues sorted by date descending.
- `getDialogue` returns a single dialogue by slug; missing slug behavior matches the essay equivalent.
- A dialogue with all annotations and a bare dialogue (turns only) both load without error.

## Implementation note

`AGENTS.md` flags this as a modified Next.js whose APIs and conventions may differ from training data. Before writing the routes and MDX `components` wiring, read the relevant guide(s) under `node_modules/next/dist/docs/` rather than assuming current Next.js conventions.

## Open questions

None blocking. Real preface / margin notes / afterword text for "Anchor to the Wind" to be supplied by the author during implementation.
