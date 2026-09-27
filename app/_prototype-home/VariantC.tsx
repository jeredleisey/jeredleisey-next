// PROTOTYPE (#57). Throwaway. Not for main.
// C: "Ledger". Data-forward, like the dense text on the relativity posters. The sentence is set
// very large, at a scale nothing else on the site uses (the one break). The feed is a ledger with
// a date, a kind mark, the title, and the summary on each row. A count line annotates the whole.
import Link from 'next/link';
import { KIND_LABEL, SENTENCE, type ProtoItem } from './sample-feed';

export const nameC = 'Ledger';

const stamp = (d: Date) => d.toISOString().slice(0, 10).replaceAll('-', '.');

// One mark for each kind. Only the Project mark takes the accent.
function Mark({ kind }: { kind: ProtoItem['kind'] }) {
  if (kind === 'project') return <span aria-hidden className="inline-block w-2 h-2 rounded-full bg-my-orange" />;
  if (kind === 'post') return <span aria-hidden className="inline-block w-2 h-2 bg-my-espresso dark:bg-my-cream" />;
  return <span aria-hidden className="inline-block w-2 h-2 rounded-full border border-my-walnut dark:border-my-stone" />;
}

export function VariantC({ items }: { items: ProtoItem[] }) {
  const count = (k: ProtoItem['kind']) => items.filter((i) => i.kind === k).length;

  return (
    <div className="pt-pad-4 pb-32 overflow-x-hidden">
      <p className="px-pad-2 text-[clamp(2.5rem,6vw,5.5rem)] max-w-[16ch] font-light leading-[0.95] tracking-tight text-my-espresso dark:text-my-cream">
        {SENTENCE}
      </p>

      <div className="px-pad-2 mt-pad-4">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] uppercase tracking-widest text-my-walnut dark:text-my-stone border-b border-my-espresso/60 dark:border-my-cream/40 pb-2">
          <span>Index of work</span>
          <span className="flex items-center gap-1.5"><Mark kind="project" /> {count('project')} Projects</span>
          <span className="flex items-center gap-1.5"><Mark kind="post" /> {count('post')} Dispatches</span>
          <span className="flex items-center gap-1.5"><Mark kind="update" /> {count('update')} Life</span>
        </div>

        <ul>
          {items.map((item) => (
            <li key={`${item.kind}-${item.slug}`}>
              <Link
                href={item.href}
                className="group grid grid-cols-[6.5rem_1rem_1fr] md:grid-cols-[7rem_1.25rem_minmax(0,22rem)_1fr_auto] items-baseline gap-x-3 py-3 border-b border-my-stone/40 dark:border-my-stone/15 hover:bg-my-parchment/60 dark:hover:bg-white/[0.03] transition-colors"
              >
                <time className="text-xs font-mono tabular-nums text-my-walnut dark:text-my-stone">{stamp(item.date)}</time>
                <Mark kind={item.kind} />
                <span className="text-sm text-my-espresso dark:text-my-cream">
                  {item.title ?? <span className="italic font-serif">{item.summary}</span>}
                  <span className="sr-only"> ({KIND_LABEL[item.kind]})</span>
                </span>
                <span className="col-start-3 md:col-start-auto text-xs text-my-walnut dark:text-my-stone leading-relaxed">
                  {item.title ? item.summary : item.photo ? '1 photo' : ''}
                  {item.sample && <span className="ml-2 text-my-stone">[sample]</span>}
                </span>
                <span className="hidden md:inline text-xs text-my-stone group-hover:text-my-espresso dark:group-hover:text-my-cream transition-colors">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
