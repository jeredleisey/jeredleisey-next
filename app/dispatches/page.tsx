import Link from 'next/link';
import {
  getFacetCounts,
  getPosts,
  getSeriesParts,
  splitFacet,
  type FacetCount,
  type Post,
  type PostFilters,
  type Series,
} from '@/lib/content';
import { formatDate } from '@/lib/format';

export const metadata = { title: 'Dispatches — Jered Leisey' };

// Drafts show only while Jered runs the site in development.
const includeDrafts = process.env.NODE_ENV === 'development';

type FilterKey = keyof PostFilters;
const FILTER_KEYS: FilterKey[] = ['topic', 'audience', 'useCase'];
type FilterGroup = { key: FilterKey; label: string; counts: FacetCount[] };

// The list is newest first by default. The other view puts the Posts under their Series,
// in reading order.
type View = 'latest' | 'series';
type SeriesPlace = { series: Series; part: number; parts: number };
type SeriesGroup = { series: Series; posts: Post[] };

const meta = 'text-my-walnut/60 dark:text-my-stone/60 text-xs uppercase tracking-widest';

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

// A repeated parameter (?topic=a&topic=b) counts as its first value.
function firstValue(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first === undefined || first === '' ? undefined : first;
}

// The list URL for a view and a set of filters.
function listHref(view: View, filters: PostFilters): string {
  const params = new URLSearchParams();
  if (view === 'series') params.set('view', 'series');
  for (const k of FILTER_KEYS) {
    const v = filters[k];
    if (v !== undefined) params.set(k, v);
  }
  const query = params.toString();
  return query ? `/dispatches?${query}` : '/dispatches';
}

const shortDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

// One Post in a list. The Series name is its own link, so it sits outside the link to
// the Post.
function PostRow({ post, place }: { post: Post; place?: SeriesPlace }) {
  return (
    <li className="flex flex-col gap-1 py-5 border-b border-my-stone/30 dark:border-my-espresso/30 last:border-0">
      <span className={meta}>
        {formatDate(post.date)}
        {place && (
          <>
            {' · '}
            <Link href={`/dispatches/series/${place.series.slug}`} className="hover:text-my-orange transition-colors">
              {place.series.title}
            </Link>
            {` · Part ${place.part} of ${place.parts}`}
          </>
        )}
        {post.draft && <span className="text-my-orange"> · Draft</span>}
      </span>
      <Link href={`/dispatches/${post.slug}`} className="group flex flex-col gap-1">
        <span className="text-my-espresso dark:text-my-cream text-sm group-hover:text-my-orange transition-colors">
          {post.title}
        </span>
        <span className="text-my-walnut dark:text-my-stone text-xs leading-relaxed">{post.description}</span>
      </Link>
    </li>
  );
}

export default async function DispatchesPage({ searchParams }: Props) {
  const query = await searchParams;
  const filters: PostFilters = {
    topic: firstValue(query.topic),
    audience: firstValue(query.audience),
    useCase: firstValue(query.useCase),
  };
  const filtered = FILTER_KEYS.some((k) => filters[k] !== undefined);

  const posts = getPosts({ includeDrafts, ...filters });
  // The part numbers come from all the Posts, so a filter does not change them.
  const places = getSeriesParts({ includeDrafts });
  const view: View = firstValue(query.view) === 'series' && places.size > 0 ? 'series' : 'latest';

  const facets = getFacetCounts({ includeDrafts });
  const allGroups: FilterGroup[] = [
    { key: 'topic', label: 'Topic', counts: facets.topics },
    { key: 'audience', label: 'Audience', counts: facets.audiences },
    { key: 'useCase', label: 'Use case', counts: facets.useCases },
  ];
  const groups = allGroups.filter((g) => g.counts.length > 0);

  // One facet set to a value, or cleared when the value is already active. The view and
  // the other active filters stay.
  const chip = (key: FilterKey, { value, count }: FacetCount) => {
    const active = filters[key] === value;
    return (
      <Link
        key={value}
        href={listHref(view, { ...filters, [key]: active ? undefined : value })}
        aria-current={active ? 'true' : undefined}
        className={`border px-2 py-0.5 text-xs font-light transition-colors ${
          active
            ? 'border-my-orange text-my-orange'
            : 'border-my-stone/40 dark:border-my-stone/20 text-my-walnut dark:text-my-stone hover:border-my-orange hover:text-my-orange'
        }`}
      >
        {value} <span className="tabular-nums opacity-60">{count}</span>
      </Link>
    );
  };

  // The Series in order of their newest Post, each with its Posts in reading order, and
  // then the Posts in no Series.
  const seriesGroups: SeriesGroup[] = [];
  const singles: Post[] = [];
  for (const post of posts) {
    const place = places.get(post.slug);
    if (!place) {
      singles.push(post);
      continue;
    }
    const group = seriesGroups.find((g) => g.series.slug === place.series.slug);
    if (group) group.posts.push(post);
    else seriesGroups.push({ series: place.series, posts: [post] });
  }
  for (const group of seriesGroups) {
    group.posts.sort((a, b) => (places.get(a.slug)?.part ?? 0) - (places.get(b.slug)?.part ?? 0));
  }

  return (
    <div className="p-pad-2 max-w-lg">
      <div className="flex items-baseline justify-between gap-4 mb-pad-2">
        <h1 className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest">Dispatches</h1>
        {places.size > 0 && (
          <nav aria-label="Order of Posts" className="flex gap-4 text-xs uppercase tracking-widest">
            {(['latest', 'series'] as const).map((v) => (
              <Link
                key={v}
                href={listHref(v, filters)}
                aria-current={view === v ? 'true' : undefined}
                className={`pb-0.5 border-b transition-colors ${
                  view === v
                    ? 'border-my-espresso dark:border-my-cream text-my-espresso dark:text-my-cream'
                    : 'border-transparent text-my-walnut/60 dark:text-my-stone/60 hover:text-my-orange'
                }`}
              >
                {v === 'latest' ? 'Latest' : 'By Series'}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {(groups.length > 0 || filtered) && (
        <nav aria-label="Filter Posts" className="flex flex-col gap-3 mb-pad-2">
          {groups.map((group) => {
            const { shown, more } = splitFacet(group.counts, filters[group.key]);
            return (
              <div key={group.key} className="flex flex-wrap items-baseline gap-2">
                <span className={`w-20 shrink-0 ${meta}`}>{group.label}</span>
                {shown.map((c) => chip(group.key, c))}
                {/* The values on one Post only stay closed until the reader asks for them. */}
                {more.length > 0 && (
                  <details className="group open:basis-full">
                    <summary className="inline-block cursor-pointer list-none [&::-webkit-details-marker]:hidden py-0.5 text-xs font-light text-my-walnut/70 dark:text-my-stone/70 underline underline-offset-4 decoration-my-stone/60 hover:text-my-orange transition-colors">
                      <span className="group-open:hidden">{more.length} more</span>
                      <span className="hidden group-open:inline">Fewer</span>
                    </summary>
                    <div className="flex flex-wrap gap-2 mt-2">{more.map((c) => chip(group.key, c))}</div>
                  </details>
                )}
              </div>
            );
          })}
          {filtered && (
            <Link
              href={listHref(view, {})}
              className="self-start text-my-orange hover:text-my-espresso dark:hover:text-my-cream text-xs uppercase tracking-widest transition-colors"
            >
              Clear filters
            </Link>
          )}
        </nav>
      )}

      {posts.length === 0 ? (
        <p className="text-my-walnut dark:text-my-stone text-sm font-light">
          {filtered ? 'No Posts match these filters.' : 'No Posts yet.'}
        </p>
      ) : view === 'latest' ? (
        <ul className="flex flex-col gap-0">
          {posts.map((post) => (
            <PostRow key={post.slug} post={post} place={places.get(post.slug)} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-pad-2">
          {seriesGroups.map(({ series, posts: parts }) => (
            <section key={series.slug} aria-labelledby={`series-${series.slug}`}>
              <p className={meta}>
                Series · {series.posts.length} {series.posts.length === 1 ? 'part' : 'parts'}
              </p>
              <h2 id={`series-${series.slug}`} className="mt-1 text-lg font-light leading-snug">
                <Link
                  href={`/dispatches/series/${series.slug}`}
                  className="text-my-espresso dark:text-my-cream hover:text-my-orange transition-colors"
                >
                  {series.title}
                </Link>
              </h2>
              {series.description && (
                <p className="mt-1 text-my-walnut dark:text-my-stone text-xs leading-relaxed">{series.description}</p>
              )}
              <ol className="mt-3">
                {parts.map((post) => (
                  <li key={post.slug} className="border-b border-my-stone/30 dark:border-my-espresso/30 last:border-0">
                    <Link
                      href={`/dispatches/${post.slug}`}
                      className="group grid grid-cols-[1.5rem_1fr_auto] items-baseline gap-x-2 py-2.5"
                    >
                      <span className="text-xs tabular-nums text-my-walnut/60 dark:text-my-stone/60">
                        {places.get(post.slug)?.part}
                      </span>
                      <span className="text-my-espresso dark:text-my-cream text-sm group-hover:text-my-orange transition-colors">
                        {post.title}
                        {post.draft && <span className="text-my-orange text-xs uppercase tracking-widest"> · Draft</span>}
                      </span>
                      <time
                        dateTime={post.date.toISOString().slice(0, 10)}
                        className="text-xs tabular-nums text-my-walnut dark:text-my-stone"
                      >
                        {shortDate(post.date)}
                      </time>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
          {singles.length > 0 && (
            <section aria-labelledby="single-posts">
              {seriesGroups.length > 0 && (
                <h2 id="single-posts" className={meta}>
                  Single Posts
                </h2>
              )}
              <ul className="flex flex-col gap-0">
                {singles.map((post) => (
                  <PostRow key={post.slug} post={post} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
