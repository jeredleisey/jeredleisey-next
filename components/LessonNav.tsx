import Link from 'next/link';

interface LessonNavProps {
  seriesSlug: string;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}

export function LessonNav({ seriesSlug, prev, next }: LessonNavProps) {
  return (
    <div className="flex justify-between border-t border-my-espresso/30 pt-6 mt-12">
      {prev ? (
        <Link
          href={`/learn/${seriesSlug}/${prev.slug}`}
          className="group flex flex-col gap-1 max-w-[45%]"
        >
          <span className="text-my-stone text-xs uppercase tracking-widest">← Previous</span>
          <span className="text-my-cream text-sm group-hover:text-my-orange transition-colors leading-snug">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={`/learn/${seriesSlug}/${next.slug}`}
          className="group flex flex-col gap-1 items-end text-right max-w-[45%]"
        >
          <span className="text-my-stone text-xs uppercase tracking-widest">Next →</span>
          <span className="text-my-cream text-sm group-hover:text-my-orange transition-colors leading-snug">
            {next.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
