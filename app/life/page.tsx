import Link from 'next/link';
import { UpdateBody } from '@/components/life/UpdateBody';
import { getUpdates } from '@/lib/content';
import { formatDate } from '@/lib/format';

export const metadata = { title: 'Life — Jered Leisey' };

// Drafts show only while Jered runs the site in development.
const includeDrafts = process.env.NODE_ENV === 'development';

export default function LifePage() {
  const updates = getUpdates({ includeDrafts });

  return (
    <div className="p-pad-2 max-w-2xl">
      <h1 className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-pad-2">Life</h1>

      {updates.length === 0 ? (
        <p className="text-my-walnut dark:text-my-stone text-sm font-light">No Updates yet.</p>
      ) : (
        <ul className="flex flex-col gap-0">
          {updates.map((update) => (
            <li
              key={update.slug}
              className="border-b border-my-stone/30 dark:border-my-espresso/30 last:border-0 py-6 flex flex-col gap-2"
            >
              <Link href={`/life/${update.slug}`} className="group flex flex-col gap-1">
                <span className="text-my-walnut/60 dark:text-my-stone/60 text-xs uppercase tracking-widest group-hover:text-my-orange transition-colors">
                  {formatDate(update.date)}
                  {update.draft && <span className="text-my-orange"> · Draft</span>}
                </span>
                {update.title && (
                  <span className="text-my-espresso dark:text-my-cream text-sm group-hover:text-my-orange transition-colors">
                    {update.title}
                  </span>
                )}
              </Link>
              <UpdateBody update={update} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
