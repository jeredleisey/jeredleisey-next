// PROTOTYPE (reading pages). Throwaway. Not for main.
// C: "Spread". The title is set very large across the page, over a data line of date, words,
// and minutes. The body sits offset to the right, and one orange hairline marks where it
// starts: the one break.
import Link from 'next/link';
import type { ReadingDoc } from './doc';
import { Facets, MetaLine, SeriesNav, Title, meta } from './Parts';

export function VariantC({ doc }: { doc: ReadingDoc }) {
  return (
    <article className="px-pad-2 py-pad-4">
      <header>
        <MetaLine doc={doc} withWords />
        <Title
          doc={doc}
          className="mt-6 font-serif font-light text-5xl xl:text-6xl leading-[1.02] tracking-tight text-my-espresso dark:text-my-cream max-w-[16ch]"
        />
        {doc.description && (
          <p className="mt-8 text-xl font-light leading-snug text-my-walnut dark:text-my-stone max-w-[36rem]">{doc.description}</p>
        )}
      </header>

      <div className="mt-pad-4 lg:ml-[14%] max-w-[40rem] relative">
        <span aria-hidden className="hidden lg:block absolute -left-12 top-3 w-8 h-px bg-my-orange" />
        {doc.body}

        {(doc.series || doc.project || doc.facets.some((f) => f.values.length)) && (
        <footer className="mt-pad-4 pt-6 border-t border-my-stone/30 dark:border-my-stone/15 grid gap-8 sm:grid-cols-2">
          <div className="space-y-3">
            {doc.series && (
              <p className="text-xs">
                <span className={meta}>Part {doc.series.part} of {doc.series.parts} · </span>
                <Link href={`/dispatches/series/${doc.series.slug}`} className="text-my-orange">{doc.series.title}</Link>
              </p>
            )}
            {doc.project && (
              <p className="text-xs">
                <span className={meta}>Project · </span>
                <Link href={`/projects/${doc.project.slug}`} className="text-my-orange">{doc.project.title}</Link>
              </p>
            )}
          </div>
          <Facets doc={doc} />
          <SeriesNav doc={doc} className="sm:col-span-2" />
        </footer>
        )}
      </div>
    </article>
  );
}
