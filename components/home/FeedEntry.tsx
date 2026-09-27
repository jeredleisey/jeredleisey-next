import Image from 'next/image';
import Link from 'next/link';
import type { FeedItem, FeedKind } from '@/lib/content';

export const KIND_LABEL: Record<FeedKind, string> = {
  project: 'Project',
  post: 'Dispatch',
  update: 'Life',
};

const label = 'text-[11px] uppercase tracking-widest text-my-walnut dark:text-my-stone';

// One of the newest items on the home page. Each kind has its own shape: a Project is
// a framed panel with the page's one orange action, a Post has a serif headline, and
// an Update shows its first photo.
export function FeedEntry({ item }: { item: FeedItem }) {
  if (item.kind === 'project') {
    return (
      <Link href={item.href} className="group block border border-my-espresso/70 dark:border-my-cream/40 p-5">
        <span className="flex items-baseline justify-between gap-4">
          <span className={label}>{KIND_LABEL.project}</span>
          <span className="text-xs text-my-orange">Open →</span>
        </span>
        <span className="block mt-3 text-xl text-my-espresso dark:text-my-cream">{item.title}</span>
        <span className="block mt-1 text-sm text-my-walnut dark:text-my-stone leading-relaxed">{item.summary}</span>
      </Link>
    );
  }

  if (item.kind === 'post') {
    return (
      <Link href={item.href} className="group block">
        <span className={label}>
          {KIND_LABEL.post}
          {item.seriesTitle && ` · ${item.seriesTitle}`}
        </span>
        <span className="block mt-1 font-serif text-2xl leading-snug text-my-espresso dark:text-my-cream group-hover:underline underline-offset-4 decoration-1 decoration-my-stone">
          {item.title}
        </span>
        <span className="block mt-2 text-sm text-my-walnut dark:text-my-stone leading-relaxed">{item.summary}</span>
      </Link>
    );
  }

  return (
    <Link href={item.href} className="group block">
      <span className={label}>{KIND_LABEL.update}</span>
      {item.title && <span className="block mt-1 text-my-espresso dark:text-my-cream">{item.title}</span>}
      <span className="block mt-1 text-sm text-my-espresso/85 dark:text-my-cream/85 leading-relaxed">{item.summary}</span>
      {item.photo && (
        <Image
          src={item.photo.src}
          alt={item.photo.alt}
          width={item.photo.width}
          height={item.photo.height}
          sizes="20rem"
          className="mt-3 h-auto w-full max-w-xs rounded-sm"
        />
      )}
    </Link>
  );
}

const shortDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

// An older item on the home page: one quiet line under its year.
export function FeedRow({ item }: { item: FeedItem }) {
  return (
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
        </span>
      </span>
      <time dateTime={item.date.toISOString().slice(0, 10)} className="text-xs text-my-walnut dark:text-my-stone tabular-nums">
        {shortDate(item.date)}
      </time>
    </Link>
  );
}
