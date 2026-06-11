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
