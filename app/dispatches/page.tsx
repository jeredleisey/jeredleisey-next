import Link from 'next/link';
import { getFacets, getPosts, type PostFilters } from '@/lib/content';
import { formatDate } from '@/lib/format';

export const metadata = { title: 'Dispatches — Jered Leisey' };

// Drafts show only while Jered runs the site in development.
const includeDrafts = process.env.NODE_ENV === 'development';

type FilterKey = keyof PostFilters;
const FILTER_KEYS: FilterKey[] = ['topic', 'audience', 'useCase'];
type FilterGroup = { key: FilterKey; label: string; values: string[] };

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

// A repeated parameter (?topic=a&topic=b) counts as its first value.
function firstValue(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first === undefined || first === '' ? undefined : first;
}

// The list URL with one facet set to a value, or cleared when the value is already active.
// The other active filters stay.
function hrefWith(filters: PostFilters, key: FilterKey, value: string): string {
  const next: PostFilters = { ...filters, [key]: filters[key] === value ? undefined : value };
  const params = new URLSearchParams();
  for (const k of FILTER_KEYS) {
    const v = next[k];
    if (v !== undefined) params.set(k, v);
  }
  const query = params.toString();
  return query ? `/dispatches?${query}` : '/dispatches';
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
  const facets = getFacets({ includeDrafts });
  const allGroups: FilterGroup[] = [
    { key: 'topic', label: 'Topic', values: facets.topics },
    { key: 'audience', label: 'Audience', values: facets.audiences },
    { key: 'useCase', label: 'Use case', values: facets.useCases },
  ];
  const groups = allGroups.filter((g) => g.values.length > 0);

  return (
    <div className="p-pad-2 max-w-lg">
      <h1 className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-pad-2">Dispatches</h1>

      {(groups.length > 0 || filtered) && (
        <nav aria-label="Filter Posts" className="flex flex-col gap-3 mb-pad-2">
          {groups.map((group) => (
            <div key={group.key} className="flex flex-wrap items-baseline gap-2">
              <span className="w-20 shrink-0 text-my-walnut/60 dark:text-my-stone/60 text-xs uppercase tracking-widest">
                {group.label}
              </span>
              {group.values.map((value) => {
                const active = filters[group.key] === value;
                return (
                  <Link
                    key={value}
                    href={hrefWith(filters, group.key, value)}
                    aria-current={active ? 'true' : undefined}
                    className={`border px-2 py-0.5 text-xs font-light transition-colors ${
                      active
                        ? 'border-my-orange text-my-orange'
                        : 'border-my-stone/40 dark:border-my-stone/20 text-my-walnut dark:text-my-stone hover:border-my-orange hover:text-my-orange'
                    }`}
                  >
                    {value}
                  </Link>
                );
              })}
            </div>
          ))}
          {filtered && (
            <Link
              href="/dispatches"
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
      ) : (
        <ul className="flex flex-col gap-0">
          {posts.map((post) => (
            <li key={post.slug} className="border-b border-my-stone/30 dark:border-my-espresso/30 last:border-0">
              <Link href={`/dispatches/${post.slug}`} className="group flex flex-col gap-1 py-5">
                <span className="text-my-walnut/60 dark:text-my-stone/60 text-xs uppercase tracking-widest">
                  {formatDate(post.date)}
                  {post.draft && <span className="text-my-orange"> · Draft</span>}
                </span>
                <span className="text-my-espresso dark:text-my-cream text-sm group-hover:text-my-orange transition-colors">
                  {post.title}
                </span>
                <span className="text-my-walnut dark:text-my-stone text-xs leading-relaxed">
                  {post.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
