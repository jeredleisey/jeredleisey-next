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
                ? 'border-my-orange text-my-cream bg-my-orange/5'
                : 'border-my-espresso/40 text-my-stone hover:text-my-cream hover:border-my-stone'
            }`}
          >
            {project.metadata.title}
          </Link>
        );
      })}
    </div>
  );
}
