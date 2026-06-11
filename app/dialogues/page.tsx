import Link from 'next/link';
import { getAllDialogues } from '@/lib/content';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Dialogues — Jered Leisey' };

export default function DialoguesPage() {
  const dialogues = getAllDialogues();

  return (
    <div className="p-pad-2 max-w-3xl">
      <h1 className="text-my-espresso dark:text-my-cream text-4xl font-light leading-none">
        Dialogues
      </h1>
      <p className="mt-4 text-my-walnut dark:text-my-stone text-sm leading-relaxed max-w-[60ch]">
        Unedited conversations with frontier AI models, kept whole. These aren&rsquo;t
        lessons — they&rsquo;re the record of thinking out loud with a machine that thinks back.
      </p>
      <hr className="mt-9 border-0 h-px bg-my-espresso dark:bg-my-stone/40" />

      <ul className="flex flex-col gap-0">
        {dialogues.map((d) => (
          <li
            key={d.slug}
            className="border-b border-my-stone/30 dark:border-my-espresso/30 last:border-0"
          >
            <Link
              href={`/dialogues/${d.slug}`}
              className="group grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-8 py-7"
            >
              <div>
                <span className="block text-my-espresso dark:text-my-cream text-xl group-hover:text-my-orange transition-colors">
                  {d.metadata.title}
                </span>
                <span className="block mt-2 text-my-walnut dark:text-my-stone text-sm leading-relaxed max-w-[58ch]">
                  {d.metadata.summary}
                </span>
              </div>
              <div className="sm:text-right">
                <span className="block text-my-espresso dark:text-my-cream text-xs uppercase tracking-wide font-medium">
                  {d.metadata.model}
                </span>
                <span className="block mt-1 text-my-walnut/50 dark:text-my-stone/50 text-xs uppercase">
                  {formatDate(d.metadata.date)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
