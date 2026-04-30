import Link from 'next/link';
import { getAllSeries } from '@/lib/content';

export const metadata = { title: 'Learn — Jered Leisey' };

export default function LearnPage() {
  const allSeries = getAllSeries();
  const level101 = allSeries.filter((s) => s.metadata.level === 101);
  const level201 = allSeries.filter((s) => s.metadata.level === 201);

  return (
    <div className="p-pad-2 max-w-lg">
      <h1 className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-pad-2">Learn</h1>

      {level101.length > 0 && (
        <section className="mb-8">
          <h2 className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest border-b border-my-stone/30 dark:border-my-espresso/30 pb-2 mb-4">
            101 — Foundations
          </h2>
          <ul className="flex flex-col gap-4">
            {level101.map((series) => (
              <li key={series.slug}>
                <Link
                  href={`/learn/${series.slug}`}
                  className="group flex items-baseline justify-between gap-4"
                >
                  <span className="text-my-espresso dark:text-my-cream text-sm group-hover:text-my-orange transition-colors">
                    {series.metadata.title}
                  </span>
                  <span className="flex items-center gap-3 shrink-0">
                    <span className="text-my-walnut dark:text-my-stone text-xs">
                      {series.lessons.length} lesson{series.lessons.length !== 1 ? 's' : ''}
                    </span>
                    {series.metadata.status === 'active' && (
                      <span className="text-my-orange text-xs uppercase tracking-widest">Active</span>
                    )}
                    {series.metadata.status === 'coming-soon' && (
                      <span className="text-my-walnut/50 dark:text-my-stone/50 text-xs uppercase tracking-widest">Soon</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {level201.length > 0 && (
        <section>
          <h2 className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest border-b border-my-stone/30 dark:border-my-espresso/30 pb-2 mb-4">
            201 — Applied
          </h2>
          <ul className="flex flex-col gap-4">
            {level201.map((series) => (
              <li key={series.slug}>
                <Link
                  href={`/learn/${series.slug}`}
                  className="group flex items-baseline justify-between gap-4"
                >
                  <span className="text-my-espresso dark:text-my-cream text-sm group-hover:text-my-orange transition-colors">
                    {series.metadata.title}
                  </span>
                  <span className="flex items-center gap-3 shrink-0">
                    <span className="text-my-walnut dark:text-my-stone text-xs">
                      {series.lessons.length} lesson{series.lessons.length !== 1 ? 's' : ''}
                    </span>
                    {series.metadata.status === 'active' && (
                      <span className="text-my-orange text-xs uppercase tracking-widest">Active</span>
                    )}
                    {series.metadata.status === 'coming-soon' && (
                      <span className="text-my-walnut/50 dark:text-my-stone/50 text-xs uppercase tracking-widest">Soon</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
