import Link from 'next/link';
import type { LessonRef } from '@/lib/types';

interface LessonRefsProps {
  refs: LessonRef[];
}

export function LessonRefs({ refs }: LessonRefsProps) {
  if (refs.length === 0) return null;

  return (
    <div className="border-t border-my-espresso/30 mt-12 pt-8">
      <h2 className="text-my-stone text-xs uppercase tracking-widest mb-4">
        Lessons used in this project
      </h2>
      <ul className="flex flex-col gap-3">
        {refs.map((ref) => (
          <li key={ref.href}>
            <Link
              href={ref.href}
              className="group flex items-baseline gap-3"
            >
              <span className="text-my-stone/60 text-xs border border-my-espresso/40 px-1.5 py-0.5 rounded shrink-0">
                {ref.level}
              </span>
              <span className="text-my-stone text-sm group-hover:text-my-orange transition-colors">
                {ref.lessonTitle}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
