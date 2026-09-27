import { FeedEntry, FeedRow } from '@/components/home/FeedEntry';
import { getFeed, splitFeed } from '@/lib/content';
import { formatDate } from '@/lib/format';

export const metadata = { title: 'Jered Leisey' };

const FEED_LENGTH = 12;

// The sentence sits on the left and stays in place. The feed runs down a rail on the
// right: the newest items as full entries, then every older item as a row under its
// year. The design comes from "How should the home page look?" (#57).
export default function HomePage() {
  const feed = getFeed({ includeDrafts: process.env.NODE_ENV === 'development', limit: FEED_LENGTH });
  const { full, years } = splitFeed(feed);

  return (
    <div className="px-pad-2 py-pad-4 lg:grid lg:grid-cols-12 lg:gap-x-10">
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-pad-4">
          {/* Placeholder: Jered writes the real sentence. */}
          <p className="font-serif font-light text-4xl xl:text-5xl leading-[1.1] text-my-espresso dark:text-my-cream max-w-md">
            Jered Leisey. Software and automation.
          </p>
          <p className="mt-6 text-xs text-my-walnut dark:text-my-stone">Latest work and life, newest first.</p>
        </div>
      </div>

      <div className="mt-pad-4 lg:mt-0 lg:col-span-6 lg:col-start-7">
        {feed.length === 0 ? (
          <p className="text-my-walnut dark:text-my-stone text-sm font-light">Nothing here yet.</p>
        ) : (
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
        )}
      </div>
    </div>
  );
}
