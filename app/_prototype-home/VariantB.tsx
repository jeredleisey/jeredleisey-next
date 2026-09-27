// PROTOTYPE (#57). Throwaway. Not for main.
// B: "Rail". Asymmetric two columns. The sentence sits large and still on the left. The feed runs
// down a hairline rail on the right, and each kind has its own shape: a Project is an instrument
// panel with the one orange action, a Dispatch is a serif headline, an Update shows its photo.
import Link from 'next/link';
import { KIND_LABEL, SENTENCE, type ProtoItem } from './sample-feed';
import { formatDate } from '@/lib/format';

export const nameB = 'Rail';

function Sample({ on }: { on?: boolean }) {
  return on ? <span className="ml-2 text-[10px] uppercase tracking-widest text-my-stone">sample</span> : null;
}

// Variant D uses this too.
export function Entry({ item }: { item: ProtoItem }) {
  if (item.kind === 'project') {
    return (
      <Link href={item.href} className="group block border border-my-espresso/70 dark:border-my-cream/40 p-5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[11px] uppercase tracking-widest text-my-walnut dark:text-my-stone">
            Project<Sample on={item.sample} />
          </span>
          <span className="text-xs text-my-orange">Open →</span>
        </div>
        <p className="mt-3 text-xl text-my-espresso dark:text-my-cream">{item.title}</p>
        <p className="mt-1 text-sm text-my-walnut dark:text-my-stone leading-relaxed">{item.summary}</p>
      </Link>
    );
  }
  if (item.kind === 'post') {
    return (
      <Link href={item.href} className="group block">
        <span className="text-[11px] uppercase tracking-widest text-my-walnut dark:text-my-stone">
          Dispatch{item.series && ` · ${item.series}`}
          <Sample on={item.sample} />
        </span>
        <p className="mt-1 font-serif text-2xl leading-snug text-my-espresso dark:text-my-cream group-hover:underline underline-offset-4 decoration-1 decoration-my-stone">
          {item.title}
        </p>
        <p className="mt-2 text-sm text-my-walnut dark:text-my-stone leading-relaxed">{item.summary}</p>
      </Link>
    );
  }
  return (
    <Link href={item.href} className="group block">
      <span className="text-[11px] uppercase tracking-widest text-my-walnut dark:text-my-stone">
        {KIND_LABEL.update}
        <Sample on={item.sample} />
      </span>
      {item.title && <p className="mt-1 text-my-espresso dark:text-my-cream">{item.title}</p>}
      <p className="mt-1 text-sm text-my-espresso/85 dark:text-my-cream/85 leading-relaxed">{item.summary}</p>
      {item.photo && (
        <div
          className="mt-3 max-w-xs rounded-sm flex items-end p-2 text-[10px] text-white/70"
          style={{ background: item.photo.tone, aspectRatio: item.photo.ratio }}
        >
          {item.photo.alt}
        </div>
      )}
    </Link>
  );
}

export function VariantB({ items }: { items: ProtoItem[] }) {
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

      <ol className="mt-pad-4 lg:mt-0 lg:col-span-6 lg:col-start-7 relative border-l border-my-stone/50 dark:border-my-stone/25 pb-24">
        {items.map((item) => (
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
    </div>
  );
}
