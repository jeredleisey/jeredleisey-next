import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatDate } from '@/lib/format';

const meta = 'text-[11px] uppercase tracking-widest text-my-walnut dark:text-my-stone';

export interface ReadingSeries {
  slug: string;
  title: string;
  part: number;
  // Every visible Part, in order.
  posts: { slug: string; title: string }[];
  previous: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}

export interface ReadingFacet {
  label: string;
  // The Dispatches list filter this facet uses, such as topic.
  param: string;
  values: string[];
}

export interface ReadingLayoutProps {
  kindLabel: string;
  date: Date;
  draft: boolean;
  // A Post has a reading time. An Update does not.
  minutes?: number;
  // An Update often has no title.
  title?: string;
  description?: string;
  series?: ReadingSeries | null;
  project?: { slug: string; title: string } | null;
  facets?: ReadingFacet[];
  slug: string;
  children: ReactNode;
}

// The page of one Post or Update. On large screens a sticky margin on a hairline rail,
// like the home feed, holds the date, the reading time, the Series with this Part marked,
// the Project, and the facets. The title and the body sit on the right. On a phone the
// title comes first, and the margin content follows the body. The design comes from #92.
export function ReadingLayout({
  kindLabel,
  date,
  draft,
  minutes,
  title,
  description,
  series,
  project,
  facets = [],
  slug,
  children,
}: ReadingLayoutProps) {
  const shownFacets = facets.filter((f) => f.values.length > 0);
  // On a phone the margin keeps only what the meta line under the title does not show.
  const marginOnPhone = Boolean(series || project || shownFacets.length > 0);

  return (
    <article className="px-pad-2 py-pad-4 grid lg:grid-cols-[13rem_minmax(0,40rem)] lg:gap-x-12">
      <aside
        aria-label={`About this ${kindLabel === 'Life' ? 'Update' : 'Post'}`}
        className={`order-last lg:order-first mt-pad-4 lg:mt-0 ${marginOnPhone ? '' : 'hidden lg:block'}`}
      >
        <div className="lg:sticky lg:top-pad-4 border-l border-my-stone/50 dark:border-my-stone/25 pl-5 space-y-6">
          <div className="relative hidden lg:block">
            <span aria-hidden className="absolute -left-[23px] top-1 w-[5px] h-[5px] rounded-full bg-my-orange" />
            <p className={meta}>{kindLabel}</p>
            <p className="mt-1 text-sm tabular-nums text-my-espresso dark:text-my-cream">{formatDate(date)}</p>
            {minutes !== undefined && <p className="text-xs text-my-walnut dark:text-my-stone">{minutes} min read</p>}
            {draft && <p className="text-xs text-my-orange">Draft</p>}
          </div>

          {series && (
            <div>
              <Link href={`/dispatches/series/${series.slug}`} className={`${meta} hover:text-my-orange transition-colors`}>
                {series.title}
              </Link>
              <ol className="mt-2 space-y-1.5">
                {series.posts.map((p, i) => (
                  <li key={p.slug} className="grid grid-cols-[1.25rem_1fr] text-xs leading-snug">
                    <span className="tabular-nums text-my-walnut dark:text-my-stone">{i + 1}</span>
                    {p.slug === slug ? (
                      <span aria-current="page" className="text-my-espresso dark:text-my-cream">
                        {p.title}
                      </span>
                    ) : (
                      <Link
                        href={`/dispatches/${p.slug}`}
                        className="text-my-walnut dark:text-my-stone hover:text-my-orange transition-colors"
                      >
                        {p.title}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {project && (
            <p className="text-xs">
              <span className={`${meta} block`}>Project</span>
              <Link
                href={`/projects/${project.slug}`}
                className="text-my-orange hover:text-my-espresso dark:hover:text-my-cream transition-colors"
              >
                {project.title}
              </Link>
            </p>
          )}

          {shownFacets.length > 0 && (
            <dl className="space-y-2 text-xs">
              {shownFacets.map((f) => (
                <div key={f.label}>
                  <dt className={meta}>{f.label}</dt>
                  <dd className="text-my-espresso dark:text-my-cream">
                    {f.values.map((value, i) => (
                      <span key={value}>
                        {i > 0 && ', '}
                        <Link
                          href={`/dispatches?${new URLSearchParams({ [f.param]: value })}`}
                          className="hover:text-my-orange transition-colors"
                        >
                          {value}
                        </Link>
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </aside>

      <div className="min-w-0">
        <p className={`${meta} tabular-nums lg:hidden mb-3`}>
          {kindLabel} · {formatDate(date)}
          {minutes !== undefined && ` · ${minutes} min read`}
          {draft && <span className="text-my-orange"> · Draft</span>}
        </p>
        {title ? (
          <h1 className="font-serif text-3xl xl:text-4xl leading-[1.15] text-my-espresso dark:text-my-cream">{title}</h1>
        ) : (
          // An Update often has no title. The page still needs a heading for screen readers.
          <h1 className="sr-only">
            {kindLabel === 'Life' ? 'Update' : kindLabel} of {formatDate(date)}
          </h1>
        )}
        {description && <p className="mt-4 text-base leading-relaxed text-my-walnut dark:text-my-stone">{description}</p>}

        <div className={title || description ? 'mt-10' : ''}>{children}</div>

        {series && (series.previous || series.next) && (
          <nav
            aria-label={`${series.title} Series`}
            className="mt-pad-4 pt-6 border-t border-my-stone/30 dark:border-my-stone/15 grid grid-cols-2 gap-5"
          >
            {series.previous ? (
              <Link href={`/dispatches/${series.previous.slug}`} className="group flex flex-col gap-1">
                <span className={meta}>← Part {series.part - 1}</span>
                <span className="font-serif text-lg leading-snug text-my-espresso dark:text-my-cream group-hover:text-my-orange transition-colors">
                  {series.previous.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {series.next && (
              <Link href={`/dispatches/${series.next.slug}`} className="group flex flex-col gap-1 text-right">
                <span className={meta}>Part {series.part + 1} →</span>
                <span className="font-serif text-lg leading-snug text-my-espresso dark:text-my-cream group-hover:text-my-orange transition-colors">
                  {series.next.title}
                </span>
              </Link>
            )}
          </nav>
        )}
      </div>
    </article>
  );
}
