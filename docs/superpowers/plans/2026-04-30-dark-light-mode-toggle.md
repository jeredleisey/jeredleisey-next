# Dark/Light Mode Toggle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a user-togglable dark/light mode — light is the CSS default, dark activates via `.dark` on `<html>`, persisted to `localStorage`, defaulting to OS preference.

**Architecture:** Tailwind `darkMode: 'class'` with light as baseline. `ThemeProvider` manages the `dark` class on `document.documentElement` and exposes a `useTheme` context hook. All current dark-mode color classes migrate to `dark:` prefixed variants. One new color token: `my-walnut` (`#7A6E64`) fills the secondary-text role in light mode where `my-stone` is too faint on cream.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v3, Vitest + @testing-library/react

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `tailwind.config.ts` | Modify | Add `darkMode: 'class'`, add `my-walnut` token |
| `components/ThemeProvider.tsx` | Create | Context + `useTheme` hook, manages `dark` class on `<html>` |
| `components/ThemeToggle.tsx` | Create | Sun/moon icon button, calls `useTheme().toggle()` |
| `__tests__/components/ThemeProvider.test.tsx` | Create | Tests localStorage, OS default, toggle |
| `__tests__/components/ThemeToggle.test.tsx` | Create | Tests render + click behavior |
| `app/layout.tsx` | Modify | Add `ThemeProvider`, update `body` base classes |
| `components/GlobalNav.tsx` | Modify | Dark variants + add `ThemeToggle` |
| `components/Sidebar.tsx` | Modify | Dark variants |
| `components/SeriesTOC.tsx` | Modify | Dark variants |
| `components/ProjectsList.tsx` | Modify | Dark variants |
| `components/WritingList.tsx` | Modify | Dark variants |
| `components/LessonNav.tsx` | Modify | Dark variants |
| `components/LessonRefs.tsx` | Modify | Dark variants |
| `app/page.tsx` | Modify | Dark variants |
| `app/learn/page.tsx` | Modify | Dark variants |
| `app/learn/[series]/page.tsx` | Modify | Dark variants |
| `app/projects/page.tsx` | Modify | Dark variants |
| `app/writing/page.tsx` | Modify | Dark variants |
| `app/learn/[series]/[lesson]/page.tsx` | Modify | Dark variants, remove `prose-invert` |
| `app/projects/[project]/page.tsx` | Modify | Dark variants, remove `prose-invert` |
| `app/writing/[essay]/page.tsx` | Modify | Dark variants, remove `prose-invert` |

**Color mapping used throughout:**

| Old (dark-only) | Light default | Dark variant |
|---|---|---|
| `bg-my-espresso` | `bg-my-cream` | `dark:bg-my-espresso` |
| `text-my-cream` | `text-my-espresso` | `dark:text-my-cream` |
| `text-my-stone` | `text-my-walnut` | `dark:text-my-stone` |
| `text-my-stone/40` | `text-my-stone` | `dark:text-my-stone/40` |
| `text-my-stone/50` | `text-my-walnut/60` | `dark:text-my-stone/50` |
| `text-my-stone/60` | `text-my-walnut/70` | `dark:text-my-stone/60` |
| `hover:text-my-cream` | `hover:text-my-espresso` | `dark:hover:text-my-cream` |
| `hover:border-my-stone` | `hover:border-my-espresso` | `dark:hover:border-my-stone` |
| `border-my-espresso/30` | `border-my-stone/30` | `dark:border-my-espresso/30` |
| `border-my-espresso/40` | `border-my-stone/40` | `dark:border-my-espresso/40` |
| `bg-my-espresso/50` (code bg) | `bg-my-stone/20` | `dark:bg-my-espresso/50` |

---

### Task 1: Tailwind config — add `darkMode` and `my-walnut`

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Update tailwind.config.ts**

```ts
import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

export default {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        my: {
          cream: '#F4EFE6',
          parchment: '#EAE3D6',
          stone: '#C2B8A8',
          walnut: '#7A6E64',
          amber: '#CC922F',
          espresso: '#1C1714',
          orange: '#FF4F00',
        },
      },
      fontFamily: {
        'neue-montreal': ['Neue-Montreal', 'sans-serif'],
      },
      spacing: {
        'pad-2': 'max(20px, 4vmin)',
        'pad-4': 'max(40px, 8vmin)',
      },
    },
  },
  plugins: [typography],
} satisfies Config;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat: add darkMode class strategy and my-walnut token"
```

---

### Task 2: ThemeProvider and useTheme hook

**Files:**
- Create: `components/ThemeProvider.tsx`
- Create: `__tests__/components/ThemeProvider.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/ThemeProvider.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('defaults to light mode when no preference is stored', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggles from light to dark and persists to localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => { result.current.toggle(); });
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('reads saved dark preference from localStorage on mount', () => {
    localStorage.setItem('theme', 'dark');
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npm test -- ThemeProvider
```

Expected: FAIL with `Cannot find module '@/components/ThemeProvider'`

- [ ] **Step 3: Create components/ThemeProvider.tsx**

```tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
    const resolved = stored ?? (prefersDark ? 'dark' : 'light');
    setTheme(resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, []);

  function toggle() {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- ThemeProvider
```

Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/ThemeProvider.tsx '__tests__/components/ThemeProvider.test.tsx'
git commit -m "feat: add ThemeProvider and useTheme hook"
```

---

### Task 3: ThemeToggle component

**Files:**
- Create: `components/ThemeToggle.tsx`
- Create: `__tests__/components/ThemeToggle.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/ThemeToggle.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('renders a button with an accessible label', () => {
    render(<ThemeToggle />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
  });

  it('adds dark class to <html> when clicked', () => {
    render(<ThemeToggle />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npm test -- ThemeToggle
```

Expected: FAIL with `Cannot find module '@/components/ThemeToggle'`

- [ ] **Step 3: Create components/ThemeToggle.tsx**

Sun/moon icons are inline SVG — no icon library dependency.

```tsx
'use client';

import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="text-my-stone hover:text-my-espresso dark:hover:text-my-cream transition-colors"
    >
      {theme === 'dark' ? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- ThemeToggle
```

Expected: 2 tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/ThemeToggle.tsx '__tests__/components/ThemeToggle.test.tsx'
git commit -m "feat: add ThemeToggle component"
```

---

### Task 4: Layout integration

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update app/layout.tsx**

```tsx
import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { getAllSeries, getAllProjects, getAllEssays } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Jered Leisey',
  description: "Whatever I'm into, I'm all the way in.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allSeries = getAllSeries();
  const allProjects = getAllProjects();
  const allEssays = getAllEssays();

  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-my-cream dark:bg-my-espresso font-neue-montreal flex transition-colors duration-200">
        <ThemeProvider>
          <Sidebar
            allSeries={allSeries}
            allProjects={allProjects}
            allEssays={allEssays}
          />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: integrate ThemeProvider into layout, set light/dark base on body"
```

---

### Task 5: GlobalNav migration + ThemeToggle

**Files:**
- Modify: `components/GlobalNav.tsx`

- [ ] **Step 1: Update components/GlobalNav.tsx**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Learn', href: '/learn' },
  { label: 'Projects', href: '/projects' },
  { label: 'Writing', href: '/writing' },
] as const;

export function GlobalNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <div className="pb-pad-2 border-b border-my-stone/30 dark:border-my-espresso/30">
      <p className="text-my-espresso dark:text-my-cream text-sm font-light mb-pad-2">
        Jered Leisey
      </p>
      <nav aria-label="Site navigation" className="flex flex-col gap-2">
        {NAV_ITEMS.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? 'page' : undefined}
            className={`text-xs transition-colors duration-150 ${
              isActive(href)
                ? 'text-my-orange'
                : 'text-my-walnut hover:text-my-espresso dark:text-my-stone dark:hover:text-my-cream'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-3">
        <ThemeToggle />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update GlobalNav test — it now renders ThemeToggle which needs ThemeProvider**

Update `__tests__/components/GlobalNav.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlobalNav } from '@/components/GlobalNav';
import { ThemeProvider } from '@/components/ThemeProvider';

vi.mock('next/navigation', () => ({
  usePathname: () => '/learn',
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('GlobalNav', () => {
  it('renders the site name', () => {
    render(<GlobalNav />, { wrapper });
    expect(screen.getByText('Jered Leisey')).toBeInTheDocument();
  });

  it('renders all four nav links', () => {
    render(<GlobalNav />, { wrapper });
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Learn' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Writing' })).toBeInTheDocument();
  });

  it('highlights the active section in orange', () => {
    render(<GlobalNav />, { wrapper });
    const learnLink = screen.getByRole('link', { name: 'Learn' });
    expect(learnLink).toHaveClass('text-my-orange');
    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).not.toHaveClass('text-my-orange');
  });

  it('renders the theme toggle button', () => {
    render(<GlobalNav />, { wrapper });
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add components/GlobalNav.tsx '__tests__/components/GlobalNav.test.tsx'
git commit -m "feat: add dark: variants to GlobalNav, mount ThemeToggle"
```

---

### Task 6: Sidebar migration

**Files:**
- Modify: `components/Sidebar.tsx`

- [ ] **Step 1: Update components/Sidebar.tsx**

```tsx
'use client';

import { usePathname } from 'next/navigation';
import { GlobalNav } from './GlobalNav';
import { SeriesTOC } from './SeriesTOC';
import { ProjectsList } from './ProjectsList';
import { WritingList } from './WritingList';
import type { SeriesWithLessons, ProjectSummary, EssaySummary } from '@/lib/types';

interface SidebarProps {
  allSeries: SeriesWithLessons[];
  allProjects: ProjectSummary[];
  allEssays: EssaySummary[];
}

export function Sidebar({ allSeries, allProjects, allEssays }: SidebarProps) {
  const pathname = usePathname();

  const lessonMatch = pathname.match(/^\/learn\/([^/]+)\/([^/]+)/);
  const inProjects = pathname.startsWith('/projects');
  const inWriting = pathname.startsWith('/writing');

  const currentSeries = lessonMatch
    ? (allSeries.find((s) => s.slug === lessonMatch[1]) ?? null)
    : null;

  return (
    <aside className="w-48 shrink-0 flex flex-col border-r border-my-stone/30 dark:border-my-stone/20 px-4 py-pad-2 bg-my-cream dark:bg-my-espresso transition-colors duration-200">
      <GlobalNav />

      {(currentSeries || inProjects || inWriting) && (
        <div className="border-t border-my-stone/30 dark:border-my-espresso/30 mt-2">
          {currentSeries && <SeriesTOC series={currentSeries} />}
          {inProjects && <ProjectsList projects={allProjects} />}
          {inWriting && <WritingList essays={allEssays} />}
        </div>
      )}

      <div className="mt-auto text-my-stone dark:text-my-stone/40 text-xs">
        © {new Date().getFullYear()}
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Sidebar.tsx
git commit -m "feat: add dark: variants to Sidebar"
```

---

### Task 7: Secondary sidebar components

**Files:**
- Modify: `components/SeriesTOC.tsx`
- Modify: `components/ProjectsList.tsx`
- Modify: `components/WritingList.tsx`

- [ ] **Step 1: Update components/SeriesTOC.tsx**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SeriesWithLessons } from '@/lib/types';

interface SeriesTOCProps {
  series: SeriesWithLessons;
}

export function SeriesTOC({ series }: SeriesTOCProps) {
  const pathname = usePathname();

  return (
    <div className="pt-pad-2 flex flex-col gap-3">
      <Link
        href={`/learn/${series.slug}`}
        className="text-my-walnut hover:text-my-espresso dark:text-my-stone dark:hover:text-my-cream text-xs leading-snug transition-colors"
      >
        {series.metadata.title}
      </Link>
      <div className="flex flex-col gap-1">
        {series.lessons.map((lesson) => {
          const href = `/learn/${series.slug}/${lesson.slug}`;
          const active = pathname === href;
          return (
            <Link
              key={lesson.slug}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`text-xs leading-snug py-1 pl-2 border-l-2 transition-colors ${
                active
                  ? 'border-my-orange text-my-espresso dark:text-my-cream bg-my-orange/5'
                  : 'border-my-stone/40 dark:border-my-espresso/40 text-my-walnut hover:text-my-espresso hover:border-my-espresso dark:text-my-stone dark:hover:text-my-cream dark:hover:border-my-stone'
              }`}
            >
              {lesson.metadata.title}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update components/ProjectsList.tsx**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ProjectSummary } from '@/lib/types';

interface ProjectsListProps {
  projects: ProjectSummary[];
}

export function ProjectsList({ projects }: ProjectsListProps) {
  const pathname = usePathname();

  return (
    <div className="pt-pad-2 flex flex-col gap-1">
      {projects.map((project) => {
        const href = `/projects/${project.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={project.slug}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`text-xs leading-snug py-1 pl-2 border-l-2 transition-colors ${
              active
                ? 'border-my-orange text-my-espresso dark:text-my-cream bg-my-orange/5'
                : 'border-my-stone/40 dark:border-my-espresso/40 text-my-walnut hover:text-my-espresso hover:border-my-espresso dark:text-my-stone dark:hover:text-my-cream dark:hover:border-my-stone'
            }`}
          >
            {project.metadata.title}
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Update components/WritingList.tsx**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { EssaySummary } from '@/lib/types';

interface WritingListProps {
  essays: EssaySummary[];
}

export function WritingList({ essays }: WritingListProps) {
  const pathname = usePathname();

  return (
    <div className="pt-pad-2 flex flex-col gap-1">
      {essays.map((essay) => {
        const href = `/writing/${essay.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={essay.slug}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`text-xs leading-snug py-1 pl-2 border-l-2 transition-colors ${
              active
                ? 'border-my-orange text-my-espresso dark:text-my-cream bg-my-orange/5'
                : 'border-my-stone/40 dark:border-my-espresso/40 text-my-walnut hover:text-my-espresso hover:border-my-espresso dark:text-my-stone dark:hover:text-my-cream dark:hover:border-my-stone'
            }`}
          >
            {essay.metadata.title}
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/SeriesTOC.tsx components/ProjectsList.tsx components/WritingList.tsx
git commit -m "feat: add dark: variants to secondary sidebar components"
```

---

### Task 8: LessonNav and LessonRefs migration

**Files:**
- Modify: `components/LessonNav.tsx`
- Modify: `components/LessonRefs.tsx`

- [ ] **Step 1: Update components/LessonNav.tsx**

```tsx
import Link from 'next/link';

interface LessonNavProps {
  seriesSlug: string;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}

export function LessonNav({ seriesSlug, prev, next }: LessonNavProps) {
  return (
    <div className="flex justify-between border-t border-my-stone/30 dark:border-my-espresso/30 pt-6 mt-12">
      {prev ? (
        <Link
          href={`/learn/${seriesSlug}/${prev.slug}`}
          className="group flex flex-col gap-1 max-w-[45%]"
        >
          <span className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest">
            ← Previous
          </span>
          <span className="text-my-espresso dark:text-my-cream text-sm group-hover:text-my-orange transition-colors leading-snug">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={`/learn/${seriesSlug}/${next.slug}`}
          className="group flex flex-col gap-1 items-end text-right max-w-[45%]"
        >
          <span className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest">
            Next →
          </span>
          <span className="text-my-espresso dark:text-my-cream text-sm group-hover:text-my-orange transition-colors leading-snug">
            {next.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update components/LessonRefs.tsx**

```tsx
import Link from 'next/link';
import type { LessonRef } from '@/lib/types';

interface LessonRefsProps {
  refs: LessonRef[];
}

export function LessonRefs({ refs }: LessonRefsProps) {
  if (refs.length === 0) return null;

  return (
    <div className="border-t border-my-stone/30 dark:border-my-espresso/30 mt-12 pt-8">
      <h2 className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-4">
        Lessons used in this project
      </h2>
      <ul className="flex flex-col gap-3">
        {refs.map((ref) => (
          <li key={ref.href}>
            <Link href={ref.href} className="group flex items-baseline gap-3">
              <span className="text-my-walnut dark:text-my-stone/60 text-xs border border-my-stone/40 dark:border-my-espresso/40 px-1.5 py-0.5 rounded shrink-0">
                {ref.level}
              </span>
              <span className="text-my-walnut dark:text-my-stone text-sm group-hover:text-my-orange transition-colors">
                {ref.lessonTitle}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/LessonNav.tsx components/LessonRefs.tsx
git commit -m "feat: add dark: variants to LessonNav and LessonRefs"
```

---

### Task 9: Index and listing page migrations

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/learn/page.tsx`
- Modify: `app/learn/[series]/page.tsx`
- Modify: `app/projects/page.tsx`
- Modify: `app/writing/page.tsx`

- [ ] **Step 1: Update app/page.tsx**

```tsx
import Link from 'next/link';
import { getAllSeries, getAllProjects, getAllEssays } from '@/lib/content';

export const metadata = { title: 'Jered Leisey' };

export default function HomePage() {
  const activeSeries = getAllSeries().find((s) => s.metadata.status === 'active') ?? null;
  const latestProject = getAllProjects()[0] ?? null;
  const latestEssay = getAllEssays()[0] ?? null;

  return (
    <div className="h-full flex flex-col p-pad-2">
      <div className="mb-pad-2">
        <h1 className="text-3xl xl:text-5xl font-light text-my-espresso dark:text-my-cream leading-tight max-w-xl">
          Whatever I&apos;m into,{' '}
          <br />
          I&apos;m{' '}
          <em className="italic text-my-orange">all the way in.</em>
          <br />
          Let me show you.
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-xl">
        {activeSeries && (
          <Link
            href={`/learn/${activeSeries.slug}`}
            className="group border border-my-stone/40 dark:border-my-espresso/40 p-4 flex flex-col gap-2 hover:border-my-orange/40 transition-colors"
          >
            <span className="text-my-orange text-xs uppercase tracking-widest">
              Now Teaching
            </span>
            <span className="text-my-espresso dark:text-my-cream text-sm font-light leading-snug group-hover:text-my-orange transition-colors">
              {activeSeries.metadata.title}
            </span>
            <span className="text-my-walnut dark:text-my-stone text-xs">
              {activeSeries.lessons.length} lesson
              {activeSeries.lessons.length !== 1 ? 's' : ''} · {activeSeries.metadata.level} level
            </span>
            <span className="mt-auto text-my-walnut/60 dark:text-my-stone/60 text-xs uppercase tracking-widest group-hover:text-my-orange transition-colors">
              Start learning →
            </span>
          </Link>
        )}

        {latestProject && (
          <Link
            href={`/projects/${latestProject.slug}`}
            className="group border border-my-stone/40 dark:border-my-espresso/40 p-4 flex flex-col gap-2 hover:border-my-stone/40 transition-colors"
          >
            <span className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest">
              Latest Project
            </span>
            <span className="text-my-espresso dark:text-my-cream text-sm font-light leading-snug group-hover:text-my-orange transition-colors">
              {latestProject.metadata.title}
            </span>
            <span className="text-my-walnut dark:text-my-stone text-xs leading-relaxed">
              {latestProject.metadata.description}
            </span>
            <span className="mt-auto text-my-walnut/60 dark:text-my-stone/60 text-xs uppercase tracking-widest group-hover:text-my-orange transition-colors">
              See it →
            </span>
          </Link>
        )}

        {latestEssay && (
          <Link
            href={`/writing/${latestEssay.slug}`}
            className="col-span-2 group border border-my-stone/40 dark:border-my-espresso/40 p-4 flex flex-col gap-2 hover:border-my-stone/40 transition-colors"
          >
            <span className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest">
              Recent Writing
            </span>
            <span className="text-my-espresso dark:text-my-cream text-sm font-light leading-snug group-hover:text-my-orange transition-colors">
              {latestEssay.metadata.title}
            </span>
            <span className="text-my-walnut dark:text-my-stone text-xs leading-relaxed">
              {latestEssay.metadata.description}
            </span>
          </Link>
        )}
      </div>

      <div className="mt-auto border-t border-my-stone/30 dark:border-my-espresso/30 pt-3 flex justify-between">
        <span className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest">Asheville, NC</span>
        <span className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest">Est. 2025</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update app/learn/page.tsx**

```tsx
import Link from 'next/link';
import { getAllSeries } from '@/lib/content';

export const metadata = { title: 'Learn — Jered Leisey' };

export default function LearnPage() {
  const allSeries = getAllSeries();
  const level101 = allSeries.filter((s) => s.metadata.level === 101);
  const level201 = allSeries.filter((s) => s.metadata.level === 201);

  return (
    <div className="p-pad-2 max-w-lg">
      <h1 className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-pad-2">Learn</h1>

      {level101.length > 0 && (
        <section className="mb-8">
          <h2 className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest border-b border-my-stone/30 dark:border-my-espresso/30 pb-2 mb-4">
            101 — Foundations
          </h2>
          <ul className="flex flex-col gap-4">
            {level101.map((series) => (
              <li key={series.slug}>
                <Link
                  href={`/learn/${series.slug}`}
                  className="group flex items-baseline justify-between gap-4"
                >
                  <span className="text-my-espresso dark:text-my-cream text-sm group-hover:text-my-orange transition-colors">
                    {series.metadata.title}
                  </span>
                  <span className="flex items-center gap-3 shrink-0">
                    <span className="text-my-walnut dark:text-my-stone text-xs">
                      {series.lessons.length} lesson{series.lessons.length !== 1 ? 's' : ''}
                    </span>
                    {series.metadata.status === 'active' && (
                      <span className="text-my-orange text-xs uppercase tracking-widest">Active</span>
                    )}
                    {series.metadata.status === 'coming-soon' && (
                      <span className="text-my-walnut/50 dark:text-my-stone/50 text-xs uppercase tracking-widest">Soon</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {level201.length > 0 && (
        <section>
          <h2 className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest border-b border-my-stone/30 dark:border-my-espresso/30 pb-2 mb-4">
            201 — Applied
          </h2>
          <ul className="flex flex-col gap-4">
            {level201.map((series) => (
              <li key={series.slug}>
                <Link
                  href={`/learn/${series.slug}`}
                  className="group flex items-baseline justify-between gap-4"
                >
                  <span className="text-my-espresso dark:text-my-cream text-sm group-hover:text-my-orange transition-colors">
                    {series.metadata.title}
                  </span>
                  <span className="flex items-center gap-3 shrink-0">
                    <span className="text-my-walnut dark:text-my-stone text-xs">
                      {series.lessons.length} lesson{series.lessons.length !== 1 ? 's' : ''}
                    </span>
                    {series.metadata.status === 'active' && (
                      <span className="text-my-orange text-xs uppercase tracking-widest">Active</span>
                    )}
                    {series.metadata.status === 'coming-soon' && (
                      <span className="text-my-walnut/50 dark:text-my-stone/50 text-xs uppercase tracking-widest">Soon</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update app/learn/[series]/page.tsx**

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSeries, getAllSeries } from '@/lib/content';

export async function generateStaticParams() {
  return getAllSeries().map((s) => ({ series: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ series: string }> }) {
  const { series: seriesSlug } = await params;
  const series = getSeries(seriesSlug);
  if (!series) return {};
  return {
    title: `${series.metadata.title} — Jered Leisey`,
    description: series.metadata.description,
  };
}

export default async function SeriesPage({ params }: { params: Promise<{ series: string }> }) {
  const { series: seriesSlug } = await params;
  const series = getSeries(seriesSlug);
  if (!series) notFound();

  return (
    <div className="p-pad-2 max-w-lg">
      <div className="mb-pad-2">
        <Link
          href="/learn"
          className="text-my-walnut hover:text-my-espresso dark:text-my-stone dark:hover:text-my-cream text-xs uppercase tracking-widest transition-colors"
        >
          ← Learn
        </Link>
      </div>

      <div className="mb-8">
        <span className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest">
          {series.metadata.level === 101 ? '101 — Foundations' : '201 — Applied'}
        </span>
        <h1 className="text-my-espresso dark:text-my-cream text-2xl font-light mt-2 leading-snug">
          {series.metadata.title}
        </h1>
        <p className="text-my-walnut dark:text-my-stone text-sm mt-3 leading-relaxed">
          {series.metadata.description}
        </p>
      </div>

      <ul className="flex flex-col gap-0">
        {series.lessons.map((lesson, idx) => (
          <li key={lesson.slug} className="border-b border-my-stone/30 dark:border-my-espresso/30 last:border-0">
            <Link
              href={`/learn/${series.slug}/${lesson.slug}`}
              className="group flex items-baseline gap-4 py-4"
            >
              <span className="text-my-stone dark:text-my-stone/40 text-xs w-5 shrink-0">{idx + 1}</span>
              <div>
                <span className="text-my-espresso dark:text-my-cream text-sm group-hover:text-my-orange transition-colors">
                  {lesson.metadata.title}
                </span>
                {lesson.metadata.description && (
                  <p className="text-my-walnut dark:text-my-stone text-xs mt-1 leading-relaxed">
                    {lesson.metadata.description}
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {series.lessons.length > 0 && (
        <div className="mt-8">
          <Link
            href={`/learn/${seriesSlug}/${series.lessons[0].slug}`}
            className="text-my-orange text-xs uppercase tracking-widest hover:text-my-espresso dark:hover:text-my-cream transition-colors"
          >
            Start lesson 1 →
          </Link>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Update app/projects/page.tsx**

```tsx
import Link from 'next/link';
import { getAllProjects } from '@/lib/content';

export const metadata = { title: 'Projects — Jered Leisey' };

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <div className="p-pad-2 max-w-lg">
      <h1 className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-pad-2">Projects</h1>

      <ul className="flex flex-col gap-0">
        {projects.map((project) => (
          <li key={project.slug} className="border-b border-my-stone/30 dark:border-my-espresso/30 last:border-0">
            <Link
              href={`/projects/${project.slug}`}
              className="group flex flex-col gap-1 py-5"
            >
              <span className="text-my-espresso dark:text-my-cream text-sm group-hover:text-my-orange transition-colors">
                {project.metadata.title}
              </span>
              <span className="text-my-walnut dark:text-my-stone text-xs leading-relaxed">
                {project.metadata.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 5: Update app/writing/page.tsx**

```tsx
import Link from 'next/link';
import { getAllEssays } from '@/lib/content';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Writing — Jered Leisey' };

export default function WritingPage() {
  const essays = getAllEssays();

  return (
    <div className="p-pad-2 max-w-lg">
      <h1 className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-pad-2">Writing</h1>

      <ul className="flex flex-col gap-0">
        {essays.map((essay) => (
          <li key={essay.slug} className="border-b border-my-stone/30 dark:border-my-espresso/30 last:border-0">
            <Link
              href={`/writing/${essay.slug}`}
              className="group flex flex-col gap-1 py-5"
            >
              <span className="text-my-espresso dark:text-my-cream text-sm group-hover:text-my-orange transition-colors">
                {essay.metadata.title}
              </span>
              <span className="text-my-walnut dark:text-my-stone text-xs leading-relaxed">
                {essay.metadata.description}
              </span>
              <span className="text-my-walnut/50 dark:text-my-stone/50 text-xs mt-1">
                {formatDate(essay.metadata.date)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/learn/page.tsx 'app/learn/[series]/page.tsx' app/projects/page.tsx app/writing/page.tsx
git commit -m "feat: add dark: variants to index and listing pages"
```

---

### Task 10: MDX content pages — prose styles

**Files:**
- Modify: `app/learn/[series]/[lesson]/page.tsx`
- Modify: `app/projects/[project]/page.tsx`
- Modify: `app/writing/[essay]/page.tsx`

`prose-invert` is removed from all three. Each prose modifier now has explicit light and dark classes. The shared prose block is identical across all three pages.

- [ ] **Step 1: Update app/learn/[series]/[lesson]/page.tsx**

```tsx
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getLesson, getAllSeries } from '@/lib/content';
import { LessonNav } from '@/components/LessonNav';

export async function generateStaticParams() {
  const allSeries = getAllSeries();
  return allSeries.flatMap((series) =>
    series.lessons.map((lesson) => ({
      series: series.slug,
      lesson: lesson.slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ series: string; lesson: string }>;
}) {
  const { series: seriesSlug, lesson: lessonSlug } = await params;
  const lesson = getLesson(seriesSlug, lessonSlug);
  if (!lesson) return {};
  return {
    title: `${lesson.metadata.title} — Jered Leisey`,
    description: lesson.metadata.description,
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ series: string; lesson: string }>;
}) {
  const { series: seriesSlug, lesson: lessonSlug } = await params;
  const lesson = getLesson(seriesSlug, lessonSlug);
  if (!lesson) notFound();

  return (
    <div className="p-pad-2 max-w-2xl">
      <div className="mb-8">
        <p className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-3">
          Lesson {lesson.metadata.order} of {lesson.totalLessons}
        </p>
        <h1 className="text-my-espresso dark:text-my-cream text-2xl font-light leading-snug">
          {lesson.metadata.title}
        </h1>
      </div>

      <div className="prose prose-sm max-w-none
        prose-headings:font-light prose-headings:text-my-espresso dark:prose-headings:text-my-cream
        prose-p:text-my-walnut dark:prose-p:text-my-stone prose-p:leading-relaxed
        prose-a:text-my-orange prose-a:no-underline hover:prose-a:text-my-espresso dark:hover:prose-a:text-my-cream
        prose-strong:text-my-espresso dark:prose-strong:text-my-cream prose-strong:font-normal
        prose-code:text-my-amber prose-code:bg-my-stone/20 dark:prose-code:bg-my-espresso/50 prose-code:px-1 prose-code:rounded
        prose-pre:bg-my-stone/20 dark:prose-pre:bg-my-espresso/50 prose-pre:border prose-pre:border-my-stone/30 dark:prose-pre:border-my-espresso/30">
        <MDXRemote source={lesson.content} />
      </div>

      <LessonNav
        seriesSlug={seriesSlug}
        prev={lesson.prev}
        next={lesson.next}
      />
    </div>
  );
}
```

- [ ] **Step 2: Update app/projects/[project]/page.tsx**

```tsx
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getProject, getAllProjects } from '@/lib/content';
import { LessonRefs } from '@/components/LessonRefs';

export async function generateStaticParams() {
  return getAllProjects().map((p) => ({ project: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ project: string }> }) {
  const { project: projectSlug } = await params;
  const project = getProject(projectSlug);
  if (!project) return {};
  return {
    title: `${project.metadata.title} — Jered Leisey`,
    description: project.metadata.description,
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ project: string }> }) {
  const { project: projectSlug } = await params;
  const project = getProject(projectSlug);
  if (!project) notFound();

  return (
    <div className="p-pad-2 max-w-2xl">
      <div className="mb-8">
        <p className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-3">Project</p>
        <h1 className="text-my-espresso dark:text-my-cream text-2xl font-light leading-snug">
          {project.metadata.title}
        </h1>
        <p className="text-my-walnut dark:text-my-stone text-sm mt-3 leading-relaxed">
          {project.metadata.description}
        </p>
      </div>

      <div className="prose prose-sm max-w-none
        prose-headings:font-light prose-headings:text-my-espresso dark:prose-headings:text-my-cream
        prose-p:text-my-walnut dark:prose-p:text-my-stone prose-p:leading-relaxed
        prose-a:text-my-orange prose-a:no-underline hover:prose-a:text-my-espresso dark:hover:prose-a:text-my-cream
        prose-strong:text-my-espresso dark:prose-strong:text-my-cream prose-strong:font-normal
        prose-code:text-my-amber prose-code:bg-my-stone/20 dark:prose-code:bg-my-espresso/50 prose-code:px-1 prose-code:rounded
        prose-pre:bg-my-stone/20 dark:prose-pre:bg-my-espresso/50 prose-pre:border prose-pre:border-my-stone/30 dark:prose-pre:border-my-espresso/30">
        <MDXRemote source={project.content} />
      </div>

      <LessonRefs refs={project.lessonRefs} />
    </div>
  );
}
```

- [ ] **Step 3: Update app/writing/[essay]/page.tsx**

```tsx
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getEssay, getAllEssays } from '@/lib/content';
import { formatDate } from '@/lib/utils';

export async function generateStaticParams() {
  return getAllEssays().map((e) => ({ essay: e.slug }));
}

function readTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 238));
  return `${minutes} min read`;
}

export async function generateMetadata({ params }: { params: Promise<{ essay: string }> }) {
  const { essay: essaySlug } = await params;
  const essay = getEssay(essaySlug);
  if (!essay) return {};
  return {
    title: `${essay.metadata.title} — Jered Leisey`,
    description: essay.metadata.description,
  };
}

export default async function EssayPage({ params }: { params: Promise<{ essay: string }> }) {
  const { essay: essaySlug } = await params;
  const essay = getEssay(essaySlug);
  if (!essay) notFound();

  return (
    <div className="p-pad-2 max-w-2xl">
      <div className="mb-8">
        <p className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-3">
          {formatDate(essay.metadata.date)} · {readTime(essay.content)}
        </p>
        <h1 className="text-my-espresso dark:text-my-cream text-2xl font-light leading-snug">
          {essay.metadata.title}
        </h1>
      </div>

      <div className="prose prose-sm max-w-none
        prose-headings:font-light prose-headings:text-my-espresso dark:prose-headings:text-my-cream
        prose-p:text-my-walnut dark:prose-p:text-my-stone prose-p:leading-relaxed
        prose-a:text-my-orange prose-a:no-underline hover:prose-a:text-my-espresso dark:hover:prose-a:text-my-cream
        prose-strong:text-my-espresso dark:prose-strong:text-my-cream prose-strong:font-normal
        prose-code:text-my-amber prose-code:bg-my-stone/20 dark:prose-code:bg-my-espresso/50 prose-code:px-1 prose-code:rounded
        prose-pre:bg-my-stone/20 dark:prose-pre:bg-my-espresso/50 prose-pre:border prose-pre:border-my-stone/30 dark:prose-pre:border-my-espresso/30">
        <MDXRemote source={essay.content} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add 'app/learn/[series]/[lesson]/page.tsx' 'app/projects/[project]/page.tsx' 'app/writing/[essay]/page.tsx'
git commit -m "feat: add dark: variants to MDX content pages, remove prose-invert"
```

---

### Task 11: Final verification

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 2: Production build**

```bash
npm run build
```

Expected: build completes with no TypeScript errors and no missing class warnings

- [ ] **Step 3: Visual verification**

```bash
npm run dev
```

Open `http://localhost:3000` and verify in this order:

1. Page loads in **light mode** (cream background, espresso text)
2. Moon icon visible in GlobalNav below nav links
3. Click toggle → switches to **dark mode** (espresso background, cream text), sun icon appears
4. Reload page → dark mode persists
5. Click toggle → back to light mode, persists on reload
6. Visit `/learn`, `/projects`, `/writing` — all render correctly in both modes
7. Visit a lesson page — prose text is readable in both modes
8. Visit a project page — `LessonRefs` renders correctly in both modes

- [ ] **Step 4: Push**

```bash
git push
```
