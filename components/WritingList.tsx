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
