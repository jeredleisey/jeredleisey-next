"use client";

import { usePathname } from "next/navigation";
import { GlobalNav } from "./GlobalNav";
import { SeriesTOC } from "./SeriesTOC";
import { ProjectsList } from "./ProjectsList";
import { WritingList } from "./WritingList";
import type {
  SeriesWithLessons,
  ProjectSummary,
  EssaySummary,
} from "@/lib/types";

interface SidebarProps {
  allSeries: SeriesWithLessons[];
  allProjects: ProjectSummary[];
  allEssays: EssaySummary[];
}

export function Sidebar({ allSeries, allProjects, allEssays }: SidebarProps) {
  const pathname = usePathname();

  const lessonMatch = pathname.match(/^\/learn\/([^/]+)\/([^/]+)/);
  const inProjects = pathname.startsWith("/projects");
  const inWriting = pathname.startsWith("/writing");

  const currentSeries = lessonMatch
    ? (allSeries.find((s) => s.slug === lessonMatch[1]) ?? null)
    : null;

  return (
    <aside className="w-48 shrink-0 flex flex-col border-r border-my-stone/20 px-4 py-pad-2">
      <GlobalNav />

      {(currentSeries || inProjects || inWriting) && (
        <div className="border-t border-my-espresso/30 mt-2">
          {currentSeries && <SeriesTOC series={currentSeries} />}
          {inProjects && <ProjectsList projects={allProjects} />}
          {inWriting && <WritingList essays={allEssays} />}
        </div>
      )}

      <div className="mt-auto text-my-espresso/40 text-xs">
        © {new Date().getFullYear()}
      </div>
    </aside>
  );
}
