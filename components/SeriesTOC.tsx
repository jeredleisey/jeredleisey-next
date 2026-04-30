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
