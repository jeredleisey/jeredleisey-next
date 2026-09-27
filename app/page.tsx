import Link from 'next/link';
import { getFeed, type FeedKind } from '@/lib/content';
import { formatDate } from '@/lib/format';
// PROTOTYPE (#57). Throwaway: the variants and the switcher never go to main.
import { PrototypeSwitcher } from '@/components/PrototypeSwitcher';
import { withSamples } from './_prototype-home/sample-feed';
import { VariantA, nameA } from './_prototype-home/VariantA';
import { VariantB, nameB } from './_prototype-home/VariantB';
import { VariantC, nameC } from './_prototype-home/VariantC';
import { VariantD, nameD } from './_prototype-home/VariantD';

export const metadata = { title: 'Jered Leisey' };

// An interim home page. Its final design comes from "How should the home page look?" (#57).
const KIND_LABEL: Record<FeedKind, string> = {
  project: 'Project',
  post: 'Dispatch',
  update: 'Life',
};

const FEED_LENGTH = 12;

// PROTOTYPE (#57): four home page variants on this route, chosen by ?variant=.
const VARIANTS = [
  { key: '0', name: 'Current' },
  { key: 'A', name: nameA },
  { key: 'B', name: nameB },
  { key: 'C', name: nameC },
  { key: 'D', name: nameD },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const raw = (await searchParams).variant;
  const variant = VARIANTS.some((v) => v.key === raw) ? (raw as string) : 'A';
  const feed = getFeed({ includeDrafts: process.env.NODE_ENV === 'development', limit: FEED_LENGTH });
  const items = withSamples(feed).slice(0, FEED_LENGTH);

  return (
    <>
      {variant === 'A' && <VariantA items={items} />}
      {variant === 'B' && <VariantB items={items} />}
      {variant === 'C' && <VariantC items={items} />}
      {variant === 'D' && <VariantD items={items} />}
      {variant === '0' && <CurrentHome feed={feed} />}
      <PrototypeSwitcher variants={VARIANTS} current={variant} />
    </>
  );
}

function CurrentHome({ feed }: { feed: ReturnType<typeof getFeed> }) {
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
