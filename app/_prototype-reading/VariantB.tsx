// PROTOTYPE (reading pages). Throwaway. Not for main.
// B: "Margin rail". The feed's rail continues onto the page. A sticky left column holds the
// date on a dot, the reading time, the whole series with this part marked, and the topics.
// The title and the body sit on the right.
import Link from 'next/link';
import { formatDate } from '@/lib/format';
import type { ReadingDoc } from './doc';
import { Facets, SeriesNav, Title, meta } from './Parts';

export function VariantB({ doc }: { doc: ReadingDoc }) {
  return (
    <article className="px-pad-2 py-pad-4 lg:grid lg:grid-cols-[13rem_minmax(0,40rem)] lg:gap-x-12">
      <aside className="mb-10 lg:mb-0">
        <div className="lg:sticky lg:top-pad-4 relative border-l border-my-stone/50 dark:border-my-stone/25 pl-5 space-y-6">
          <div className="relative">
            <span aria-hidden className="absolute -left-[23px] top-1 w-[5px] h-[5px] rounded-full bg-my-orange" />
            <p className={meta}>{doc.kindLabel}</p>
            <p className="mt-1 text-sm tabular-nums text-my-espresso dark:text-my-cream">{formatDate(doc.date)}</p>
            {doc.kind === 'post' && <p className="text-xs text-my-walnut dark:text-my-stone">{doc.minutes} min read</p>}
            {doc.draft && <p className="text-xs text-my-orange">Draft</p>}
          </div>

          {doc.series && (
            <div>
              <Link href={`/dispatches/series/${doc.series.slug}`} className={`${meta} hover:text-my-orange`}>
                {doc.series.title}
              </Link>
              <ol className="mt-2 space-y-1.5">
                {doc.series.posts.map((p, i) => (
                  <li key={p.slug} className="grid grid-cols-[1.25rem_1fr] text-xs leading-snug">
                    <span className="tabular-nums text-my-walnut dark:text-my-stone">{i + 1}</span>
                    {p.current ? (
                      <span className="text-my-espresso dark:text-my-cream">{p.title}</span>
                    ) : (
                      <Link href={`/dispatches/${p.slug}`} className="text-my-walnut dark:text-my-stone hover:text-my-orange">
                        {p.title}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {doc.project && (
            <p className="text-xs">
              <span className={`${meta} block`}>Project</span>
              <Link href={`/projects/${doc.project.slug}`} className="text-my-orange">{doc.project.title}</Link>
            </p>
          )}

          <Facets doc={doc} className="!grid-cols-1" />
        </div>
      </aside>

      <div>
        <Title
          doc={doc}
          className="font-serif text-3xl xl:text-4xl leading-[1.15] text-my-espresso dark:text-my-cream"
        />
        {doc.description && (
          <p className="mt-4 text-base leading-relaxed text-my-walnut dark:text-my-stone">{doc.description}</p>
        )}
        <div className={doc.title || doc.description ? 'mt-10' : ''}>{doc.body}</div>
        <SeriesNav doc={doc} className="mt-pad-4 pt-6 border-t border-my-stone/30 dark:border-my-stone/15" />
      </div>
    </article>
  );
}
