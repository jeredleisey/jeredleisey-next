'use client';

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

  const lessonMatch = pathname.match(/^\/learn\/([^/]+)\/([^/]+)/);
  const inProjects = pathname.startsWith('/projects');
  const inWriting = pathname.startsWith('/writing');
  const inDialogues = pathname.startsWith('/dialogues');

  const currentSeries = lessonMatch
    ? (allSeries.find((s) => s.slug === lessonMatch[1]) ?? null)
    : null;

  return (
    <aside className="w-48 shrink-0 flex flex-col border-r border-my-stone/30 dark:border-my-stone/20 px-4 py-pad-2 bg-my-cream dark:bg-my-espresso transition-colors duration-200">
      <GlobalNav />

      {(currentSeries || inProjects || inWriting || inDialogues) && (
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
  );
}
