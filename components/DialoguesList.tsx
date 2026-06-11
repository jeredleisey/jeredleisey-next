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
