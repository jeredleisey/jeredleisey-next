import { Children, isValidElement, type ReactNode } from 'react';
import { Note } from './Note';

// The site owner; any other speaker name is treated as the AI and accented.
const HUMAN = 'Jered';

export function Turn({ who, children }: { who: string; children: ReactNode }) {
  const isHuman = who === HUMAN;
  const kids = Children.toArray(children);
  const note = kids.find((c) => isValidElement(c) && c.type === Note) ?? null;
  const body = kids.filter((c) => !(isValidElement(c) && c.type === Note));

  const label = isHuman
    ? 'text-my-espresso dark:text-my-cream'
    : 'text-my-orange';

  return (
    <div className="grid grid-cols-1 md:grid-cols-[6rem_1fr_14rem] gap-3 md:gap-8 py-6 border-t border-my-parchment dark:border-my-espresso/40 first:border-t-0">
      <div className="md:sticky md:top-6 self-start">
        <span className={`text-[13px] font-semibold tracking-wide ${label}`}>
          {who}
        </span>
      </div>
      <div className="font-serif text-[18px] leading-[1.7] text-my-espresso dark:text-my-cream max-w-[62ch] [&>p]:mb-3.5 [&>p:last-child]:mb-0 [&_em]:italic [&_strong]:font-semibold [&_strong]:text-my-espresso dark:[&_strong]:text-my-cream">
        {body}
      </div>
      {note && <div>{note}</div>}
    </div>
  );
}
