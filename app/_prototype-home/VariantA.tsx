// PROTOTYPE (#57). Throwaway. Not for main.
// A: "Index". Closest to darioamodei.com. One narrow column, words only, grouped by year.
// The one break: an orange hairline hangs in the left margin beside the newest item.
import Link from 'next/link';
import { KIND_LABEL, SENTENCE, type ProtoItem } from './sample-feed';

const short = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export const nameA = 'Index';

export function VariantA({ items }: { items: ProtoItem[] }) {
  const years = [...new Set(items.map((i) => i.date.getUTCFullYear()))];

  return (
    <div className="px-pad-2 pt-pad-4 pb-32">
      <div className="max-w-2xl">
        <h1 className="text-my-espresso dark:text-my-cream text-3xl font-light tracking-tight">Jered Leisey</h1>
        <p className="mt-3 font-serif text-lg text-my-walnut dark:text-my-stone leading-relaxed max-w-lg">{SENTENCE}</p>

        {years.map((year) => (
          <section key={year} className={year === years[0] ? 'mt-pad-4' : 'mt-pad-2'}>
            <h2 className="text-xs tracking-widest text-my-walnut dark:text-my-stone tabular-nums mb-2">{year}</h2>
            <ul>
              {items
                .filter((i) => i.date.getUTCFullYear() === year)
                .map((item) => {
                  const newest = item === items[0];
                  return (
                    <li key={`${item.kind}-${item.slug}`} className="relative">
                      {newest && (
                        <span aria-hidden className="absolute -left-10 top-1/2 w-7 h-px bg-my-orange" />
                      )}
                      <Link
                        href={item.href}
                        className="group grid grid-cols-[1fr_auto] items-baseline gap-x-6 py-2.5 border-b border-my-stone/30 dark:border-my-stone/15"
                      >
                        <span className="min-w-0">
                          {item.title ? (
                            <span className="text-my-espresso dark:text-my-cream group-hover:underline underline-offset-4 decoration-my-stone">
                              {item.title}
                            </span>
                          ) : (
                            <span className="font-serif italic text-my-espresso/80 dark:text-my-cream/80 group-hover:underline underline-offset-4 decoration-my-stone">
                              {item.summary}
                            </span>
                          )}
                          <span className="ml-2 text-[11px] uppercase tracking-widest text-my-walnut/80 dark:text-my-stone/70">
                            {KIND_LABEL[item.kind]}
                            {item.photo && ' · photo'}
                            {item.sample && ' · sample'}
                          </span>
                        </span>
                        <span className="text-xs text-my-walnut dark:text-my-stone tabular-nums">{short(item.date)}</span>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
