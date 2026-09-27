import { FeedEntry, FeedRow } from './FeedEntry';
import type { SplitFeed } from '@/lib/content';
import { formatDate } from '@/lib/format';

// The feed on its rail: the newest items as full entries, then every older item as a
// row under its year. The home page shows it on small screens, and the feed panel shows
// it on large ones.
export function FeedList({ feed: { full, years } }: { feed: SplitFeed }) {
  if (full.length === 0) {
    return <p className="text-my-walnut dark:text-my-stone text-sm font-light">Nothing here yet.</p>;
  }

  return (
    <div className="border-l border-my-stone/50 dark:border-my-stone/25 pb-12">
      <ol>
        {full.map((item) => (
          <li key={`${item.kind}-${item.slug}`} className="relative pl-8 pb-12 last:pb-10">
            <span
              aria-hidden
              className="absolute -left-[3px] top-1.5 w-[5px] h-[5px] rounded-full bg-my-walnut dark:bg-my-stone"
            />
            <time
              dateTime={item.date.toISOString().slice(0, 10)}
              className="block text-xs tabular-nums text-my-walnut dark:text-my-stone mb-2"
            >
              {formatDate(item.date)}
            </time>
            <FeedEntry item={item} />
          </li>
        ))}
      </ol>

      {years.map(({ year, items }) => (
        <section key={year} className="relative pl-8 pb-10 last:pb-0">
          {/* A year is a short tick across the rail, not a dot. */}
          <span aria-hidden className="absolute -left-[6px] top-[0.45rem] w-[11px] h-px bg-my-walnut dark:bg-my-stone" />
          <h2 className="text-xs tracking-widest tabular-nums text-my-walnut dark:text-my-stone mb-1">{year}</h2>
          <ul>
            {items.map((item) => (
              <li key={`${item.kind}-${item.slug}`}>
                <FeedRow item={item} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
