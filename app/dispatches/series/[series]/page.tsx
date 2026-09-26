import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllSeries, getSeries } from '@/lib/content';
import { formatDate } from '@/lib/format';

// Drafts show only while Jered runs the site in development. The build lists only
// the Series that published Posts name, and a slug that is not listed is a 404.
// The static segment "series" wins over the Post route /dispatches/[slug].
const includeDrafts = process.env.NODE_ENV === 'development';

export const dynamicParams = false;

type Props = { params: Promise<{ series: string }> };

export function generateStaticParams() {
  return getAllSeries({ includeDrafts }).map((series) => ({ series: series.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { series: slug } = await params;
  const series = getSeries(slug, { includeDrafts });
  if (!series) return {};
  return { title: `${series.title} — Jered Leisey`, description: series.description };
}

export default async function SeriesPage({ params }: Props) {
  const { series: slug } = await params;
  const series = getSeries(slug, { includeDrafts });
  if (!series) notFound();

  return (
    <div className="p-pad-2 max-w-lg">
      <p className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-3">
        <Link href="/dispatches" className="hover:text-my-orange transition-colors">
          Dispatches
        </Link>{' '}
        · Series
      </p>
      <h1 className="text-my-espresso dark:text-my-cream text-2xl font-light leading-snug">{series.title}</h1>
      {series.description && (
        <p className="mt-3 text-my-walnut dark:text-my-stone text-sm font-light leading-relaxed">
          {series.description}
        </p>
      )}

      <ol className="flex flex-col gap-0 mt-pad-2">
        {series.posts.map((post, index) => (
          <li key={post.slug} className="border-b border-my-stone/30 dark:border-my-espresso/30 last:border-0">
            <Link href={`/dispatches/${post.slug}`} className="group flex flex-col gap-1 py-5">
              <span className="text-my-walnut/60 dark:text-my-stone/60 text-xs uppercase tracking-widest">
                Part {index + 1} · {formatDate(post.date)}
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
      </ol>
    </div>
  );
}
