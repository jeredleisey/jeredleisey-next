import type { ReactNode } from 'react';

export function Preface({ children }: { children: ReactNode }) {
  return (
    <section className="mt-9 mb-2 pl-5 border-l-2 border-my-orange max-w-[64ch]">
      <p className="text-[11px] tracking-[0.18em] uppercase text-my-walnut dark:text-my-stone mb-2.5">
        Preface
      </p>
      <div className="text-lg leading-relaxed text-my-espresso dark:text-my-cream [&>p]:mb-3 [&>p:last-child]:mb-0">
        {children}
      </div>
    </section>
  );
}
