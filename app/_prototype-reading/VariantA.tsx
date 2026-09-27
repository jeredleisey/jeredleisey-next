// PROTOTYPE (reading pages). Throwaway. Not for main.
// A: "Column". Editorial and quiet. A large serif title like the home sentence, the
// description in sans under it, one short rule, then the body. Series and topics at the end.
import Link from 'next/link';
import type { ReadingDoc } from './doc';
import { Facets, MetaLine, SeriesNav, Title, meta } from './Parts';

export function VariantA({ doc }: { doc: ReadingDoc }) {
  return (
    <article className="px-pad-2 py-pad-4">
      <header className="max-w-[40rem]">
        <MetaLine doc={doc} />
        <Title
          doc={doc}
          className="mt-4 font-serif font-light text-4xl xl:text-5xl leading-[1.1] text-my-espresso dark:text-my-cream"
        />
        {doc.description && (
          <p className="mt-5 text-lg leading-relaxed text-my-walnut dark:text-my-stone max-w-[34rem]">{doc.description}</p>
        )}
        {doc.series && (
          <p className="mt-5 text-xs">
            <span className={meta}>Part {doc.series.part} of {doc.series.parts} · </span>
            <Link href={`/dispatches/series/${doc.series.slug}`} className="text-my-orange hover:text-my-espresso dark:hover:text-my-cream transition-colors">
              {doc.series.title}
            </Link>
          </p>
        )}
        {doc.project && (
          <p className="mt-2 text-xs">
            <span className={meta}>Project · </span>
            <Link href={`/projects/${doc.project.slug}`} className="text-my-orange">{doc.project.title}</Link>
          </p>
        )}
      </header>

      <hr aria-hidden className="my-10 w-16 border-my-stone/60 dark:border-my-stone/30" />

      <div className="max-w-[40rem]">{doc.body}</div>

      {(doc.facets.some((f) => f.values.length) || doc.series) && (
        <footer className="max-w-[40rem] mt-pad-4 pt-6 border-t border-my-stone/30 dark:border-my-stone/15 space-y-8">
          <Facets doc={doc} />
          <SeriesNav doc={doc} />
        </footer>
      )}
    </article>
  );
}
