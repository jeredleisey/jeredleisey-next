// PROTOTYPE (reading pages). Throwaway. Not for main.
import Link from 'next/link';
import { formatDate } from '@/lib/format';
import type { ReadingDoc } from './doc';

export const meta = 'text-[11px] uppercase tracking-widest text-my-walnut dark:text-my-stone';

export function MetaLine({ doc, withWords = false }: { doc: ReadingDoc; withWords?: boolean }) {
  return (
    <p className={`${meta} tabular-nums`}>
      {doc.kindLabel} · {formatDate(doc.date)}
      {doc.kind === 'post' && <> · {withWords ? `${doc.words} words · ` : ''}{doc.minutes} min read</>}
      {doc.draft && <span className="text-my-orange"> · Draft</span>}
    </p>
  );
}

export function Facets({ doc, className = '' }: { doc: ReadingDoc; className?: string }) {
  const facets = doc.facets.filter((f) => f.values.length > 0);
  if (facets.length === 0) return null;
  return (
    <dl className={`grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs ${className}`}>
      {facets.map((f) => (
        <div key={f.label} className="contents">
          <dt className={meta}>{f.label}</dt>
          <dd className="text-my-espresso dark:text-my-cream">
            {f.values.map((v, i) => (
              <span key={v}>
                {i > 0 && ', '}
                <Link href={`/dispatches?${new URLSearchParams({ [f.param]: v })}`} className="hover:text-my-orange transition-colors">
                  {v}
                </Link>
              </span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function SeriesNav({ doc, className = '' }: { doc: ReadingDoc; className?: string }) {
  const s = doc.series;
  if (!s || (!s.previous && !s.next)) return null;
  return (
    <nav aria-label={`${s.title} Series`} className={`grid grid-cols-2 gap-5 ${className}`}>
      {s.previous ? (
        <Link href={`/dispatches/${s.previous.slug}`} className="group flex flex-col gap-1">
          <span className={meta}>← Part {s.part - 1}</span>
          <span className="font-serif text-lg leading-snug text-my-espresso dark:text-my-cream group-hover:text-my-orange transition-colors">{s.previous.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {s.next && (
        <Link href={`/dispatches/${s.next.slug}`} className="group flex flex-col gap-1 text-right">
          <span className={meta}>Part {s.part + 1} →</span>
          <span className="font-serif text-lg leading-snug text-my-espresso dark:text-my-cream group-hover:text-my-orange transition-colors">{s.next.title}</span>
        </Link>
      )}
    </nav>
  );
}

export function Title({ doc, className }: { doc: ReadingDoc; className: string }) {
  return doc.title ? (
    <h1 className={className}>{doc.title}</h1>
  ) : (
    <h1 className="sr-only">Update of {formatDate(doc.date)}</h1>
  );
}
