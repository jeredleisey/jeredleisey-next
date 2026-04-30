import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSeries, getAllSeries } from '@/lib/content';

export async function generateStaticParams() {
  return getAllSeries().map((s) => ({ series: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ series: string }> }) {
  const { series: seriesSlug } = await params;
  const series = getSeries(seriesSlug);
  if (!series) return {};
  return {
    title: `${series.metadata.title} — Jered Leisey`,
    description: series.metadata.description,
  };
}

export default async function SeriesPage({ params }: { params: Promise<{ series: string }> }) {
  const { series: seriesSlug } = await params;
  const series = getSeries(seriesSlug);
  if (!series) notFound();

  return (
    <div className="p-pad-2 max-w-lg">
      <div className="mb-pad-2">
        <Link
          href="/learn"
          className="text-my-walnut hover:text-my-espresso dark:text-my-stone dark:hover:text-my-cream text-xs uppercase tracking-widest transition-colors"
        >
          ← Learn
        </Link>
      </div>

      <div className="mb-8">
        <span className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest">
          {series.metadata.level === 101 ? '101 — Foundations' : '201 — Applied'}
        </span>
        <h1 className="text-my-espresso dark:text-my-cream text-2xl font-light mt-2 leading-snug">
          {series.metadata.title}
        </h1>
        <p className="text-my-walnut dark:text-my-stone text-sm mt-3 leading-relaxed">
          {series.metadata.description}
        </p>
      </div>

      <ul className="flex flex-col gap-0">
        {series.lessons.map((lesson, idx) => (
          <li key={lesson.slug} className="border-b border-my-stone/30 dark:border-my-espresso/30 last:border-0">
            <Link
              href={`/learn/${series.slug}/${lesson.slug}`}
              className="group flex items-baseline gap-4 py-4"
            >
              <span className="text-my-stone dark:text-my-stone/40 text-xs w-5 shrink-0">{idx + 1}</span>
              <div>
                <span className="text-my-espresso dark:text-my-cream text-sm group-hover:text-my-orange transition-colors">
                  {lesson.metadata.title}
                </span>
                {lesson.metadata.description && (
                  <p className="text-my-walnut dark:text-my-stone text-xs mt-1 leading-relaxed">
                    {lesson.metadata.description}
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {series.lessons.length > 0 && (
        <div className="mt-8">
          <Link
            href={`/learn/${seriesSlug}/${series.lessons[0].slug}`}
            className="text-my-orange text-xs uppercase tracking-widest hover:text-my-espresso dark:hover:text-my-cream transition-colors"
          >
            Start lesson 1 →
          </Link>
        </div>
      )}
    </div>
  );
}
