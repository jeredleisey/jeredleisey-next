// PROTOTYPE (#57). Throwaway. Not for main.
// D: "Rail + rows". B's layout, and the feed changes weight by count. The 5 newest items are always
// full B entries. Every older item is a quiet one-line row from A, grouped under its year on the rail.
import Link from 'next/link';
import { KIND_LABEL, SENTENCE, type ProtoItem } from './sample-feed';
import { Entry } from './VariantB';
import { formatDate } from '@/lib/format';

export const nameD = 'Rail + rows';

const FULL_ENTRIES = 5;

const short = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export function VariantD({ items }: { items: ProtoItem[] }) {
  const full = items.slice(0, FULL_ENTRIES);
  const rest = items.slice(FULL_ENTRIES);
  const years = [...new Set(rest.map((i) => i.date.getUTCFullYear()))];

  return (
    <div className="px-pad-2 py-pad-4 lg:grid lg:grid-cols-12 lg:gap-x-10">
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-pad-4">
          <p className="font-serif font-light text-4xl xl:text-5xl leading-[1.1] text-my-espresso dark:text-my-cream max-w-md">
            {SENTENCE}
          </p>
          <p className="mt-6 text-xs text-my-walnut dark:text-my-stone">Latest work and life, newest first.</p>
        </div>
      </div>

      <div className="mt-pad-4 lg:mt-0 lg:col-span-6 lg:col-start-7 relative border-l border-my-stone/50 dark:border-my-stone/25 pb-24">
        <ol>
          {full.map((item) => (
            <li key={`${item.kind}-${item.slug}`} className="relative pl-8 pb-12">
              <span
                aria-hidden
                className="absolute -left-[3px] top-1.5 w-[5px] h-[5px] rounded-full bg-my-walnut dark:bg-my-stone"
              />
              <time className="block text-xs tabular-nums text-my-walnut dark:text-my-stone mb-2">
                {formatDate(item.date)}
              </time>
              <Entry item={item} />
            </li>
          ))}
        </ol>

        {years.map((year) => (
          <section key={year} className="relative pl-8 pb-10">
            {/* A year is a short tick across the rail, not a dot. */}
            <span aria-hidden className="absolute -left-[6px] top-[0.45rem] w-[11px] h-px bg-my-walnut dark:bg-my-stone" />
            <h2 className="text-xs tracking-widest tabular-nums text-my-walnut dark:text-my-stone mb-1">{year}</h2>
            <ul>
              {rest
                .filter((i) => i.date.getUTCFullYear() === year)
                .map((item) => (
                  <li key={`${item.kind}-${item.slug}`}>
                    <Link
                      href={item.href}
                      className="group grid grid-cols-[1fr_auto] items-baseline gap-x-6 py-2.5 border-b border-my-stone/30 dark:border-my-stone/15"
                    >
                      <span className="min-w-0">
                        {item.title ? (
                          <span className="text-sm text-my-espresso dark:text-my-cream group-hover:underline underline-offset-4 decoration-my-stone">
                            {item.title}
                          </span>
                        ) : (
                          <span className="text-sm font-serif italic text-my-espresso/80 dark:text-my-cream/80 group-hover:underline underline-offset-4 decoration-my-stone">
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
                ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
