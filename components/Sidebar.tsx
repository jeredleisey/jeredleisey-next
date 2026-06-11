'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { GlobalNav } from './GlobalNav';
import { SeriesTOC } from './SeriesTOC';
import { ProjectsList } from './ProjectsList';
import { WritingList } from './WritingList';
import { DialoguesList } from './DialoguesList';
import type { SeriesWithLessons, ProjectSummary, EssaySummary, DialogueSummary } from '@/lib/types';

interface SidebarProps {
  allSeries: SeriesWithLessons[];
  allProjects: ProjectSummary[];
  allEssays: EssaySummary[];
  allDialogues: DialogueSummary[];
}

export function Sidebar({ allSeries, allProjects, allEssays, allDialogues }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const lessonMatch = pathname.match(/^\/learn\/([^/]+)\/([^/]+)/);
  const inProjects = pathname.startsWith('/projects');
  const inWriting = pathname.startsWith('/writing');
  const inDialogues = pathname.startsWith('/dialogues');

  const currentSeries = lessonMatch
    ? (allSeries.find((s) => s.slug === lessonMatch[1]) ?? null)
    : null;

  const hasSecondary = currentSeries || inProjects || inWriting || inDialogues;

  return (
    <>
      {/* Mobile top bar — only shown below md */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between h-14 px-4 bg-my-cream/95 dark:bg-my-espresso/95 backdrop-blur border-b border-my-stone/30 dark:border-my-espresso/30 transition-colors duration-200">
        <Link href="/" className="text-my-espresso dark:text-my-cream text-sm font-light">
          Jered Leisey
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={open}
          className="-mr-2 p-2 text-my-espresso dark:text-my-cream"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <line x1="3" y1="7" x2="21" y2="7" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="17" x2="21" y2="17" />
          </svg>
        </button>
      </header>

      {/* Backdrop — mobile, only when drawer open */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: static rail on desktop, slide-in drawer on mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[80%] overflow-y-auto transform transition-[transform,background-color] duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } md:static md:z-auto md:w-48 md:max-w-none md:translate-x-0 md:shrink-0 flex flex-col border-r border-my-stone/30 dark:border-my-stone/20 px-4 py-pad-2 bg-my-cream dark:bg-my-espresso`}
      >
        {/* Close button — mobile only */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close navigation menu"
          className="md:hidden self-end -mr-1 mb-1 p-1 text-my-walnut dark:text-my-stone hover:text-my-espresso dark:hover:text-my-cream transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <GlobalNav />

        {hasSecondary && (
          <div className="border-t border-my-stone/30 dark:border-my-espresso/30 mt-2">
            {currentSeries && <SeriesTOC series={currentSeries} />}
            {inProjects && <ProjectsList projects={allProjects} />}
            {inWriting && <WritingList essays={allEssays} />}
            {inDialogues && <DialoguesList dialogues={allDialogues} />}
          </div>
        )}

        <div className="mt-auto text-my-stone dark:text-my-stone/40 text-xs">
          © {new Date().getFullYear()}
        </div>
      </aside>
    </>
  );
}
