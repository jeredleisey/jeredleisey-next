import Link from 'next/link';
import { getAllSeries, getAllProjects, getAllEssays } from '@/lib/content';

export const metadata = { title: 'Jered Leisey' };

export default function HomePage() {
  const activeSeries = getAllSeries().find((s) => s.metadata.status === 'active') ?? null;
  const latestProject = getAllProjects()[0] ?? null;
  const latestEssay = getAllEssays()[0] ?? null;

  return (
    <div className="h-full flex flex-col p-pad-2">
      <div className="mb-pad-2">
        <h1 className="text-3xl xl:text-5xl font-light text-my-espresso dark:text-my-cream leading-tight max-w-xl">
          Whatever I&apos;m into,{' '}
          <br />
          I&apos;m{' '}
          <em className="italic text-my-orange">all the way in.</em>
          <br />
          Let me show you.
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-xl">
        {activeSeries && (
          <Link
            href={`/learn/${activeSeries.slug}`}
            className="group border border-my-stone/40 dark:border-my-espresso/40 p-4 flex flex-col gap-2 hover:border-my-orange/40 transition-colors"
          >
            <span className="text-my-orange text-xs uppercase tracking-widest">
              Now Teaching
            </span>
            <span className="text-my-espresso dark:text-my-cream text-sm font-light leading-snug group-hover:text-my-orange transition-colors">
              {activeSeries.metadata.title}
            </span>
            <span className="text-my-walnut dark:text-my-stone text-xs">
              {activeSeries.lessons.length} lesson
              {activeSeries.lessons.length !== 1 ? 's' : ''} · {activeSeries.metadata.level} level
            </span>
            <span className="mt-auto text-my-walnut/60 dark:text-my-stone/60 text-xs uppercase tracking-widest group-hover:text-my-orange transition-colors">
              Start learning →
            </span>
          </Link>
        )}

        {latestProject && (
          <Link
            href={`/projects/${latestProject.slug}`}
            className="group border border-my-stone/40 dark:border-my-espresso/40 p-4 flex flex-col gap-2 hover:border-my-stone/40 transition-colors"
          >
            <span className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest">
              Latest Project
            </span>
            <span className="text-my-espresso dark:text-my-cream text-sm font-light leading-snug group-hover:text-my-orange transition-colors">
              {latestProject.metadata.title}
            </span>
            <span className="text-my-walnut dark:text-my-stone text-xs leading-relaxed">
              {latestProject.metadata.description}
            </span>
            <span className="mt-auto text-my-walnut/60 dark:text-my-stone/60 text-xs uppercase tracking-widest group-hover:text-my-orange transition-colors">
              See it →
            </span>
          </Link>
        )}

        {latestEssay && (
          <Link
            href={`/writing/${latestEssay.slug}`}
            className="col-span-2 group border border-my-stone/40 dark:border-my-espresso/40 p-4 flex flex-col gap-2 hover:border-my-stone/40 transition-colors"
          >
            <span className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest">
              Recent Writing
            </span>
            <span className="text-my-espresso dark:text-my-cream text-sm font-light leading-snug group-hover:text-my-orange transition-colors">
              {latestEssay.metadata.title}
            </span>
            <span className="text-my-walnut dark:text-my-stone text-xs leading-relaxed">
              {latestEssay.metadata.description}
            </span>
          </Link>
        )}
      </div>

      <div className="mt-auto border-t border-my-stone/30 dark:border-my-espresso/30 pt-3 flex justify-between">
        <span className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest">Asheville, NC</span>
        <span className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest">Est. 2025</span>
      </div>
    </div>
  );
}
