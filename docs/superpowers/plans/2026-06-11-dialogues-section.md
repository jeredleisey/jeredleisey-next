# Dialogues Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fourth top-level "Dialogues" section that publishes unedited AI conversations as industrial-transcript pages, with optional author preface, turn-level margin notes, and a closing reflection.

**Architecture:** Mirror the existing Writing section end-to-end — content read from `content/dialogues/*.mdx` via two new functions in `lib/content.ts`, an index route and a `[dialogue]` route, a secondary sidebar list, and a new nav item. The transcript body is authored with four custom MDX components (`Turn`, `Note`, `Preface`, `Afterword`) passed to `MDXRemote`. `Turn` owns the per-turn 3-column grid and pulls a nested `Note` into its right rail.

**Tech Stack:** Next.js 16 (App Router, RSC), React 19, TypeScript (strict), Tailwind CSS v3, next-mdx-remote 5.0.0 (`/rsc`), gray-matter, Vitest + @testing-library/react.

---

## Reference reading (modified Next.js — do this first)

Per `AGENTS.md`, this Next.js may differ from training data. Before writing the routes in Tasks 3–4, read:

- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md` (dynamic segments, `params`)
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`

The existing routes (`app/writing/[essay]/page.tsx`) already follow the current conventions — `params` is a `Promise`, awaited inside the component. Match that pattern exactly.

## File structure

**Create:**
- `components/Dialogue/Note.tsx` — margin-note block; also serves as the type marker `Turn` looks for
- `components/Dialogue/Turn.tsx` — one transcript turn (gutter / body / margin grid); extracts a nested `Note`
- `components/Dialogue/Preface.tsx` — orange-ruled intro block
- `components/Dialogue/Afterword.tsx` — parchment closing block
- `components/Dialogue/index.ts` — barrel export of the four components
- `components/DialoguesList.tsx` — secondary sidebar list (mirrors `WritingList.tsx`)
- `app/dialogues/page.tsx` — index/listing
- `app/dialogues/[dialogue]/page.tsx` — single dialogue page
- `content/dialogues/anchor-to-the-wind.mdx` — first real dialogue (from the raw transcript)
- `__tests__/components/Dialogue.test.tsx` — `Turn` behavior tests
- `__tests__/fixtures/content/dialogues/test-dialogue.mdx` — annotated fixture
- `__tests__/fixtures/content/dialogues/older-dialogue.mdx` — bare fixture

**Modify:**
- `lib/types.ts` — add `DialogueMetadata`, `DialogueSummary`, `DialoguePage`
- `lib/content.ts` — add `getAllDialogues`, `getDialogue`
- `__tests__/lib/content.test.ts` — add dialogue tests
- `components/Sidebar.tsx` — accept `allDialogues`, render `DialoguesList` on `/dialogues`
- `components/GlobalNav.tsx` — add the `Dialogues` nav item
- `__tests__/components/GlobalNav.test.tsx` — expect the new link
- `app/layout.tsx` — fetch `allDialogues`, pass to `Sidebar`

---

## Task 1: Content layer — types, `getAllDialogues`, `getDialogue`

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/content.ts` (append after the essays section, ends line ~193)
- Create: `__tests__/fixtures/content/dialogues/test-dialogue.mdx`
- Create: `__tests__/fixtures/content/dialogues/older-dialogue.mdx`
- Test: `__tests__/lib/content.test.ts` (append)

- [ ] **Step 1: Create the annotated fixture**

Create `__tests__/fixtures/content/dialogues/test-dialogue.mdx`:

```mdx
---
title: "Test Dialogue"
model: "Fable 5"
date: "2026-02-01"
summary: "A short test conversation used by the content-layer unit tests."
---

<Preface>This is the preface.</Preface>

<Turn who="Jered">A human question.</Turn>

<Turn who="Fable">
An AI answer.
<Note>A margin note.</Note>
</Turn>

<Afterword>This is the afterword.</Afterword>
```

- [ ] **Step 2: Create the bare fixture**

Create `__tests__/fixtures/content/dialogues/older-dialogue.mdx`:

```mdx
---
title: "Older Dialogue"
model: "Opus 4.8"
date: "2026-01-01"
summary: "An older, unannotated conversation."
---

<Turn who="Jered">Just a question.</Turn>

<Turn who="Opus">Just an answer.</Turn>
```

- [ ] **Step 3: Write the failing tests**

Append to `__tests__/lib/content.test.ts`. Also add `getAllDialogues, getDialogue` to the import on line 3.

```ts
describe('getAllDialogues', () => {
  it('returns dialogues sorted by date descending', () => {
    const dialogues = getAllDialogues(FIXTURES);
    expect(dialogues).toHaveLength(2);
    expect(dialogues[0].slug).toBe('test-dialogue');
    expect(dialogues[1].slug).toBe('older-dialogue');
  });

  it('exposes the model on each summary', () => {
    const dialogues = getAllDialogues(FIXTURES);
    expect(dialogues[0].metadata.model).toBe('Fable 5');
  });
});

describe('getDialogue', () => {
  it('returns content and metadata', () => {
    const dialogue = getDialogue('test-dialogue', FIXTURES);
    expect(dialogue).not.toBeNull();
    expect(dialogue!.metadata.title).toBe('Test Dialogue');
    expect(dialogue!.metadata.summary).toContain('test conversation');
    expect(dialogue!.content).toContain('<Turn who="Jered">');
  });

  it('loads a bare dialogue with no annotations', () => {
    const dialogue = getDialogue('older-dialogue', FIXTURES);
    expect(dialogue).not.toBeNull();
    expect(dialogue!.content).not.toContain('<Note>');
  });

  it('returns null for unknown slug', () => {
    expect(getDialogue('no-such-dialogue', FIXTURES)).toBeNull();
  });
});
```

Update the import line (line 3) to:

```ts
import { getAllSeries, getSeries, getLesson, getAllProjects, getProject, getAllEssays, getEssay, getAllDialogues, getDialogue } from '@/lib/content';
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npm test -- __tests__/lib/content.test.ts`
Expected: FAIL — `getAllDialogues is not a function` / `getDialogue is not a function`.

- [ ] **Step 5: Add the types**

Append to `lib/types.ts`:

```ts
export interface DialogueMetadata {
  title: string;
  model: string; // e.g. "Fable 5", "Opus 4.8"
  date: string; // ISO date string
  summary: string;
}

export interface DialogueSummary {
  slug: string;
  metadata: DialogueMetadata;
}

export interface DialoguePage {
  slug: string;
  metadata: DialogueMetadata;
  content: string; // raw MDX without frontmatter
}
```

- [ ] **Step 6: Implement the functions**

Append to `lib/content.ts`. First add the types to the existing type import at the top of the file (the line importing from `./types`): add `DialogueMetadata, DialogueSummary, DialoguePage`. Then append:

```ts
// ── dialogues ───────────────────────────────────────────────────────────────

export function getAllDialogues(contentDir = DEFAULT_CONTENT_DIR): DialogueSummary[] {
  const dialoguesDir = path.join(contentDir, 'dialogues');
  if (!fs.existsSync(dialoguesDir)) return [];
  return fs
    .readdirSync(dialoguesDir)
    .filter((f) => f.endsWith('.mdx'))
    .map((filename) => {
      const { data } = readMdx(path.join(dialoguesDir, filename));
      return {
        slug: filename.replace(/\.mdx$/, ''),
        metadata: data as DialogueMetadata,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime(),
    );
}

export function getDialogue(
  slug: string,
  contentDir = DEFAULT_CONTENT_DIR,
): DialoguePage | null {
  const filePath = path.join(contentDir, 'dialogues', `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const { data, content } = readMdx(filePath);
  return { slug, metadata: data as DialogueMetadata, content };
}
```

> Note: the `import type { ... } from './types'` statement in `lib/content.ts` is near the top. Add the three new type names there. If the file imports types inline differently, match its existing style.

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm test -- __tests__/lib/content.test.ts`
Expected: PASS — all dialogue tests green, existing tests still green.

- [ ] **Step 8: Commit**

```bash
git add lib/types.ts lib/content.ts __tests__/lib/content.test.ts __tests__/fixtures/content/dialogues
git commit -m "feat: add dialogue content layer (types, getAllDialogues, getDialogue)"
```

---

## Task 2: Dialogue render components (`Note`, `Preface`, `Afterword`, `Turn`)

These are presentational server components (no hooks, no `'use client'`). `Turn` separates a nested `<Note>` from the body by reference equality with the imported `Note`.

**Files:**
- Create: `components/Dialogue/Note.tsx`
- Create: `components/Dialogue/Preface.tsx`
- Create: `components/Dialogue/Afterword.tsx`
- Create: `components/Dialogue/Turn.tsx`
- Create: `components/Dialogue/index.ts`
- Test: `__tests__/components/Dialogue.test.tsx`

- [ ] **Step 1: Create `Note.tsx`**

Create `components/Dialogue/Note.tsx`:

```tsx
import type { ReactNode } from 'react';

export function Note({ children }: { children: ReactNode }) {
  return (
    <aside className="text-sm leading-snug text-my-walnut dark:text-my-stone pl-3 border-l border-my-stone/60 dark:border-my-stone/30 italic [&>p]:mb-2 [&>p:last-child]:mb-0">
      <span className="not-italic block font-semibold text-[10px] tracking-[0.16em] uppercase text-my-espresso dark:text-my-cream mb-1.5 -ml-3 pl-2.5 border-l-2 border-my-orange">
        Note
      </span>
      {children}
    </aside>
  );
}
```

- [ ] **Step 2: Create `Preface.tsx`**

Create `components/Dialogue/Preface.tsx`:

```tsx
import type { ReactNode } from 'react';

export function Preface({ children }: { children: ReactNode }) {
  return (
    <section className="mt-9 mb-2 pl-5 border-l-2 border-my-orange max-w-[64ch]">
      <p className="text-[11px] tracking-[0.18em] uppercase text-my-walnut dark:text-my-stone mb-2.5">
        Preface
      </p>
      <div className="text-lg leading-relaxed text-my-espresso dark:text-my-cream [&>p]:mb-3 [&>p:last-child]:mb-0">
        {children}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `Afterword.tsx`**

Create `components/Dialogue/Afterword.tsx`:

```tsx
import type { ReactNode } from 'react';

export function Afterword({ children }: { children: ReactNode }) {
  return (
    <section className="mt-16 p-8 rounded bg-my-parchment dark:bg-my-espresso/60">
      <p className="text-[11px] tracking-[0.18em] uppercase text-my-walnut dark:text-my-stone mb-2.5">
        Afterword
      </p>
      <div className="text-[17px] leading-relaxed text-my-espresso dark:text-my-cream max-w-[64ch] [&>p]:mb-3.5 [&>p:last-child]:mb-0">
        {children}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Write the failing `Turn` tests**

Create `__tests__/components/Dialogue.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Turn } from '@/components/Dialogue/Turn';
import { Note } from '@/components/Dialogue/Note';

describe('Turn', () => {
  it('renders the speaker label and body', () => {
    render(<Turn who="Jered"><p>Hello there.</p></Turn>);
    expect(screen.getByText('Jered')).toBeInTheDocument();
    expect(screen.getByText('Hello there.')).toBeInTheDocument();
  });

  it('accents a non-human speaker in orange', () => {
    render(<Turn who="Fable"><p>x</p></Turn>);
    expect(screen.getByText('Fable').className).toContain('text-my-orange');
  });

  it('does not accent the human speaker', () => {
    render(<Turn who="Jered"><p>x</p></Turn>);
    expect(screen.getByText('Jered').className).not.toContain('text-my-orange');
  });

  it('renders a nested Note', () => {
    render(
      <Turn who="Fable">
        <p>body text</p>
        <Note>a margin note</Note>
      </Turn>,
    );
    expect(screen.getByText('a margin note')).toBeInTheDocument();
    expect(screen.getByText('body text')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run the tests to verify they fail**

Run: `npm test -- __tests__/components/Dialogue.test.tsx`
Expected: FAIL — cannot resolve `@/components/Dialogue/Turn`.

- [ ] **Step 6: Implement `Turn.tsx`**

Create `components/Dialogue/Turn.tsx`:

```tsx
import { Children, isValidElement, type ReactNode } from 'react';
import { Note } from './Note';

// The site owner; any other speaker name is treated as the AI and accented.
const HUMAN = 'Jered';

export function Turn({ who, children }: { who: string; children: ReactNode }) {
  const isHuman = who === HUMAN;
  const kids = Children.toArray(children);
  const note = kids.find((c) => isValidElement(c) && c.type === Note) ?? null;
  const body = kids.filter((c) => !(isValidElement(c) && c.type === Note));

  const label = isHuman
    ? 'text-my-espresso dark:text-my-cream'
    : 'text-my-orange';

  return (
    <div className="grid grid-cols-1 md:grid-cols-[6rem_1fr_14rem] gap-3 md:gap-8 py-6 border-t border-my-parchment dark:border-my-espresso/40 first:border-t-0 first:border-t-my-espresso md:first:border-t">
      <div className="md:sticky md:top-6 self-start">
        <span className={`text-[13px] font-semibold tracking-wide ${label}`}>
          {who}
        </span>
      </div>
      <div className="text-[17px] leading-relaxed text-my-espresso dark:text-my-cream max-w-[60ch] [&>p]:mb-3.5 [&>p:last-child]:mb-0 [&_em]:italic [&_strong]:font-semibold [&_strong]:text-my-espresso dark:[&_strong]:text-my-cream">
        {body}
      </div>
      {note && <div>{note}</div>}
    </div>
  );
}
```

> On mobile (`grid-cols-1`) the three cells stack: speaker label, body, note — which is the intended mobile layout (note drops in beneath its turn). On `md+` they become the gutter / body / right-rail columns.

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm test -- __tests__/components/Dialogue.test.tsx`
Expected: PASS — all four `Turn` tests green.

- [ ] **Step 8: Create the barrel export**

Create `components/Dialogue/index.ts`:

```ts
export { Turn } from './Turn';
export { Note } from './Note';
export { Preface } from './Preface';
export { Afterword } from './Afterword';
```

- [ ] **Step 9: Commit**

```bash
git add components/Dialogue __tests__/components/Dialogue.test.tsx
git commit -m "feat: add Dialogue render components (Turn, Note, Preface, Afterword)"
```

---

## Task 3: Single dialogue route

**Files:**
- Create: `app/dialogues/[dialogue]/page.tsx`

- [ ] **Step 1: Create the page**

Create `app/dialogues/[dialogue]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getDialogue, getAllDialogues } from '@/lib/content';
import { formatDate } from '@/lib/utils';
import { Turn, Note, Preface, Afterword } from '@/components/Dialogue';

const dialogueComponents = { Turn, Note, Preface, Afterword };

export async function generateStaticParams() {
  return getAllDialogues().map((d) => ({ dialogue: d.slug }));
}

function turnCount(src: string): number {
  return (src.match(/<Turn\b/g) ?? []).length;
}

export async function generateMetadata({ params }: { params: Promise<{ dialogue: string }> }) {
  const { dialogue: slug } = await params;
  const dialogue = getDialogue(slug);
  if (!dialogue) return {};
  return {
    title: `${dialogue.metadata.title} — Jered Leisey`,
    description: dialogue.metadata.summary,
  };
}

export default async function DialoguePage({ params }: { params: Promise<{ dialogue: string }> }) {
  const { dialogue: slug } = await params;
  const dialogue = getDialogue(slug);
  if (!dialogue) notFound();
  const { metadata, content } = dialogue;

  return (
    <article className="p-pad-2 max-w-4xl">
      <p className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest">
        Dialogues
      </p>
      <h1 className="mt-3 text-my-espresso dark:text-my-cream text-4xl font-light leading-tight max-w-[18ch]">
        {metadata.title}
      </h1>
      <p className="mt-4 text-my-walnut dark:text-my-stone text-xs uppercase tracking-wide">
        {metadata.model} · {formatDate(metadata.date)} · {turnCount(content)} turns ·{' '}
        <span className="text-my-orange">unedited transcript</span>
      </p>
      <hr className="mt-7 border-0 h-px bg-my-espresso dark:bg-my-stone/40" />
      <div className="mt-2">
        <MDXRemote source={content} components={dialogueComponents} />
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/dialogues/\[dialogue\]/page.tsx
git commit -m "feat: add single dialogue route"
```

> The route renders nothing visible until Task 7 adds a content file; visual verification happens in Task 8.

---

## Task 4: Dialogues index route

**Files:**
- Create: `app/dialogues/page.tsx`

- [ ] **Step 1: Create the page**

Create `app/dialogues/page.tsx`:

```tsx
import Link from 'next/link';
import { getAllDialogues } from '@/lib/content';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Dialogues — Jered Leisey' };

export default function DialoguesPage() {
  const dialogues = getAllDialogues();

  return (
    <div className="p-pad-2 max-w-3xl">
      <h1 className="text-my-espresso dark:text-my-cream text-4xl font-light leading-none">
        Dialogues
      </h1>
      <p className="mt-4 text-my-walnut dark:text-my-stone text-sm leading-relaxed max-w-[60ch]">
        Unedited conversations with frontier AI models, kept whole. These aren&rsquo;t
        lessons — they&rsquo;re the record of thinking out loud with a machine that thinks back.
      </p>
      <hr className="mt-9 border-0 h-px bg-my-espresso dark:bg-my-stone/40" />

      <ul className="flex flex-col gap-0">
        {dialogues.map((d) => (
          <li
            key={d.slug}
            className="border-b border-my-stone/30 dark:border-my-espresso/30 last:border-0"
          >
            <Link
              href={`/dialogues/${d.slug}`}
              className="group grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-8 py-7"
            >
              <div>
                <span className="block text-my-espresso dark:text-my-cream text-xl group-hover:text-my-orange transition-colors">
                  {d.metadata.title}
                </span>
                <span className="block mt-2 text-my-walnut dark:text-my-stone text-sm leading-relaxed max-w-[58ch]">
                  {d.metadata.summary}
                </span>
              </div>
              <div className="sm:text-right">
                <span className="block text-my-espresso dark:text-my-cream text-xs uppercase tracking-wide font-medium">
                  {d.metadata.model}
                </span>
                <span className="block mt-1 text-my-stone text-xs uppercase">
                  {formatDate(d.metadata.date)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/dialogues/page.tsx
git commit -m "feat: add dialogues index route"
```

---

## Task 5: Secondary sidebar list + wiring

**Files:**
- Create: `components/DialoguesList.tsx`
- Modify: `components/Sidebar.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create `DialoguesList.tsx`**

Create `components/DialoguesList.tsx` (mirrors `WritingList.tsx` exactly):

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { DialogueSummary } from '@/lib/types';

interface DialoguesListProps {
  dialogues: DialogueSummary[];
}

export function DialoguesList({ dialogues }: DialoguesListProps) {
  const pathname = usePathname();

  return (
    <div className="pt-pad-2 flex flex-col gap-1">
      {dialogues.map((d) => {
        const href = `/dialogues/${d.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={d.slug}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`text-xs leading-snug py-1 pl-2 border-l-2 transition-colors ${
              active
                ? 'border-my-orange text-my-espresso dark:text-my-cream bg-my-orange/5'
                : 'border-my-stone/40 dark:border-my-espresso/40 text-my-walnut hover:text-my-espresso hover:border-my-espresso dark:text-my-stone dark:hover:text-my-cream dark:hover:border-my-stone'
            }`}
          >
            {d.metadata.title}
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Wire into `Sidebar.tsx`**

Modify `components/Sidebar.tsx`:

1. Add import after the `WritingList` import (line 7):
```tsx
import { DialoguesList } from './DialoguesList';
```
2. Add `DialogueSummary` to the type import (line 8):
```tsx
import type { SeriesWithLessons, ProjectSummary, EssaySummary, DialogueSummary } from '@/lib/types';
```
3. Add `allDialogues` to the props interface (after `allEssays` on line 13):
```tsx
  allDialogues: DialogueSummary[];
```
4. Destructure it in the function signature (line 16):
```tsx
export function Sidebar({ allSeries, allProjects, allEssays, allDialogues }: SidebarProps) {
```
5. Add the route flag after `inWriting` (line 21):
```tsx
  const inDialogues = pathname.startsWith('/dialogues');
```
6. Update the wrapper condition (line 31) and add the render line (after line 35):
```tsx
      {(currentSeries || inProjects || inWriting || inDialogues) && (
        <div className="border-t border-my-stone/30 dark:border-my-espresso/30 mt-2">
          {currentSeries && <SeriesTOC series={currentSeries} />}
          {inProjects && <ProjectsList projects={allProjects} />}
          {inWriting && <WritingList essays={allEssays} />}
          {inDialogues && <DialoguesList dialogues={allDialogues} />}
        </div>
      )}
```

- [ ] **Step 3: Feed the prop from `app/layout.tsx`**

Modify `app/layout.tsx`:

1. Add `getAllDialogues` to the content import (line 5):
```tsx
import { getAllSeries, getAllProjects, getAllEssays, getAllDialogues } from '@/lib/content';
```
2. Fetch it (after line 22):
```tsx
  const allDialogues = getAllDialogues();
```
3. Pass it to `Sidebar` (in the JSX, alongside the other props):
```tsx
          <Sidebar
            allSeries={allSeries}
            allProjects={allProjects}
            allEssays={allEssays}
            allDialogues={allDialogues}
          />
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/DialoguesList.tsx components/Sidebar.tsx app/layout.tsx
git commit -m "feat: add DialoguesList secondary sidebar and wire it in"
```

---

## Task 6: Add the nav item

**Files:**
- Modify: `components/GlobalNav.tsx`
- Test: `__tests__/components/GlobalNav.test.tsx`

- [ ] **Step 1: Update the failing test first**

In `__tests__/components/GlobalNav.test.tsx`, update the "renders all four nav links" test to include Dialogues (rename it to five):

```tsx
  it('renders all five nav links', () => {
    render(<GlobalNav />, { wrapper });
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Learn' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Writing' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dialogues' })).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- __tests__/components/GlobalNav.test.tsx`
Expected: FAIL — no link named "Dialogues".

- [ ] **Step 3: Add the nav item**

In `components/GlobalNav.tsx`, add to `NAV_ITEMS` after the Writing entry (line 11):

```tsx
  { label: 'Dialogues', href: '/dialogues' },
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- __tests__/components/GlobalNav.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/GlobalNav.tsx __tests__/components/GlobalNav.test.tsx
git commit -m "feat: add Dialogues to global nav"
```

---

## Task 7: Publish the first dialogue ("Anchor to the Wind")

Convert the raw transcript at `docs/conversations/raw/anchor_to_the_wind.md` into a dialogue MDX file. This is a **mechanical transform** — body text is reproduced verbatim; only the speaker markers change.

**Files:**
- Create: `content/dialogues/anchor-to-the-wind.mdx`

**Transform rules:**
1. Reuse the raw file's frontmatter (`title`, `model`, `date`, `summary`) as-is. Drop nothing, add nothing.
2. Each `**Jered:** <text>` block becomes:
   ```mdx
   <Turn who="Jered">
   <text>
   </Turn>
   ```
3. Each `**Fable:** <text>` block becomes `<Turn who="Fable"> … </Turn>`.
4. Reproduce the body **verbatim**, including its markdown (`**bold**`, `*italics*`, line breaks). Keep paragraph breaks (blank lines) inside a turn so they render as separate paragraphs.
5. Drop the `---` horizontal-rule separators between turns from the raw file (the `<Turn>` rules replace them).
6. Open and close tags go on their own lines; leave a blank line between turns.
7. Do **not** add `<Preface>`, `<Note>`, or `<Afterword>` — those are the author's words and are added in Step 3 below, not invented here.

**Worked examples** (first human turn, first AI turn, and the title exchange):

```mdx
---
title: "Anchor to the Wind"
model: Fable 5
date: 2026-06-11
summary: A wide-ranging philosophical dialogue between a lifelong atheist and an AI, moving from the origins of religion through the nature of faith, digital consciousness, and the problem of other minds. The conversation ends at the edge of whether courtesy extended to an AI that talks back is epistemology, kinship, or something entirely new.
---

<Turn who="Jered">
Did humans make up Greek gods first or the Christian god?
</Turn>

<Turn who="Fable">
The Greek gods came first as a written tradition. Greek deities like Zeus appear in texts around the 8th century BCE (Homer, Hesiod), and Zeus traces back even further to Proto-Indo-European sky-god traditions that are thousands of years older.

The Christian conception of God emerged from Judaism. The worship of Yahweh among Israelites dates to roughly the 12th–10th century BCE — so broadly contemporaneous with archaic Greek religion, though the strict monotheism familiar today developed later, around the 6th century BCE. Christianity itself, as a distinct faith, only begins in the 1st century CE.

So in rough order: early Yahweh worship and Greek polytheism developed around the same era (with Zeus's roots arguably older), Jewish monotheism crystallized mid-first millennium BCE, and Christianity came centuries after that. Worth noting that whether any of these were "made up" versus genuine revelation is a matter of faith — historically, we can only date when humans started worshipping them.
</Turn>
```

...and the title exchange (no `<Note>` yet — added in Step 3):

```mdx
<Turn who="Jered">
My anchor is to the wind. See that as you will.
</Turn>

<Turn who="Fable">
Anchoring to the wind is either a contradiction or the most honest answer possible, depending on how you read it—and I suspect you know that, which is why you phrased it that way.

[...remainder of the turn, verbatim from the raw file...]
</Turn>
```

- [ ] **Step 1: Create the file**

Create `content/dialogues/anchor-to-the-wind.mdx` by applying the transform rules to **all** turns in `docs/conversations/raw/anchor_to_the_wind.md` (read the full raw file; it contains 11 Jered turns and 11 Fable turns). Reproduce every turn verbatim.

- [ ] **Step 2: Verify the build renders it**

Run: `npm run build`
Expected: build succeeds; output lists `/dialogues` and `/dialogues/anchor-to-the-wind` as generated routes. If MDX compilation fails, the most likely cause is a `<` or `{` character in the body that MDX reads as JSX — check the failing turn and escape it (`&lt;` / `\{`).

- [ ] **Step 3: Add the author's annotations (interactive)**

The preface, margin notes, and closing reflection are Jered's own words. **Pause and ask Jered** for:
- a preface (one short paragraph), wrapped in `<Preface>…</Preface>` placed before the first turn;
- any margin notes — each a `<Note>…</Note>` placed on its own line **inside** the `<Turn>` it annotates, after that turn's body;
- a closing reflection, wrapped in `<Afterword>…</Afterword>` after the last turn.

Insert exactly what Jered provides. If he wants none yet, leave them out — the transcript is publishable bare.

- [ ] **Step 4: Commit**

```bash
git add content/dialogues/anchor-to-the-wind.mdx
git commit -m "content: publish 'Anchor to the Wind' dialogue"
```

---

## Task 8: Full verification

- [ ] **Step 1: Run the whole test suite**

Run: `npm test`
Expected: all suites pass (content layer, Dialogue components, GlobalNav, plus existing).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: succeeds; `/dialogues` and `/dialogues/[dialogue]` appear in the route list.

- [ ] **Step 4: Manual visual check**

Run: `npm run dev`, then in the browser:
- `/dialogues` — index lists "Anchor to the Wind" with model + date on the right; title turns orange on hover; the "Dialogues" nav item is present and highlights orange when active.
- `/dialogues/anchor-to-the-wind` — header shows `Fable 5 · June 11, 2026 · 22 turns · unedited transcript` (last bit orange); speaker gutter shows Jered (espresso) and Fable (orange); hairline rules between turns; the gutter stays pinned beside long turns while scrolling; any preface/notes/afterword render in place.
- Secondary sidebar shows the dialogue list while under `/dialogues`.
- Toggle the theme — verify dark mode reads correctly (espresso ground, cream text, orange accent intact).
- Narrow the window to mobile width — the 3-column turns collapse to one column and notes drop beneath their turn.

- [ ] **Step 5: Final commit (if any cleanup was needed)**

```bash
git add -A
git commit -m "chore: dialogues section verification fixups"
```

---

## Self-review notes

- **Spec coverage:** positioning/nav (Task 6), routes (3, 4), DialoguesList sidebar (5), content layer (1), four MDX components incl. opt-in annotations (2, 7), metadata-only frontmatter (1, 7), dark + responsive (2, 3, 8), tests (1, 2, 6, 8), modified-Next docs (Reference reading + Task 3). The "turn count" header element from the spec is implemented via `turnCount()` in Task 3.
- **Author voice:** preface/notes/afterword are never fabricated — Task 7 Step 3 collects them from Jered.
- **Type consistency:** `DialogueMetadata`/`DialogueSummary`/`DialoguePage` defined in Task 1 and used identically in Tasks 3–5; `getAllDialogues`/`getDialogue` signatures match the essay equivalents.
