import type { ReactNode } from 'react';

export function Afterword({ children }: { children: ReactNode }) {
  return (
    <section className="mt-16 p-8 rounded bg-my-parchment dark:bg-my-espresso/60">
      <p className="text-[11px] tracking-[0.18em] uppercase text-my-walnut dark:text-my-stone mb-2.5">
        Afterword
      </p>
      <div className="font-serif text-[18px] leading-[1.7] text-my-espresso dark:text-my-cream max-w-[64ch] [&>p]:mb-3.5 [&>p:last-child]:mb-0">
        {children}
      </div>
    </section>
  );
}
