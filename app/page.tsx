import Link from 'next/link';
import { getFeed, type FeedKind } from '@/lib/content';
import { formatDate } from '@/lib/format';

export const metadata = { title: 'Jered Leisey' };

// An interim home page. Its final design comes from "How should the home page look?" (#57).
const KIND_LABEL: Record<FeedKind, string> = {
  project: 'Project',
  post: 'Dispatch',
  update: 'Life',
};

const FEED_LENGTH = 12;

export default function HomePage() {
  const feed = getFeed({ includeDrafts: process.env.NODE_ENV === 'development', limit: FEED_LENGTH });

  return (
    <div className="h-full flex flex-col p-pad-2">
      {/* Placeholder: Jered writes the real sentence. */}
      <p className="text-xl xl:text-2xl font-light text-my-espresso dark:text-my-cream leading-snug max-w-xl mb-pad-2">
        Jered Leisey. Software and automation.
      </p>

      <h2 className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-3">Latest</h2>
      {feed.length === 0 ? (
        <p className="text-my-walnut dark:text-my-stone text-sm font-light">Nothing here yet.</p>
      ) : (
        <ul className="max-w-xl">
          {feed.map((item) => (
            <li
              key={`${item.kind}-${item.slug}`}
              className="border-b border-my-stone/30 dark:border-my-espresso/30 last:border-0"
            >
              <Link href={item.href} className="group flex flex-col gap-1 py-4">
                <span className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest">
                  {KIND_LABEL[item.kind]} · {formatDate(item.date)}
                </span>
                {item.title && (
                  <span className="text-my-espresso dark:text-my-cream text-sm group-hover:text-my-orange transition-colors">
                    {item.title}
                  </span>
                )}
                <span className="text-my-walnut dark:text-my-stone text-xs leading-relaxed">{item.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
