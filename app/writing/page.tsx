import Link from 'next/link';
import { getAllEssays } from '@/lib/content';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Writing — Jered Leisey' };

export default function WritingPage() {
  const essays = getAllEssays();

  return (
    <div className="p-pad-2 max-w-lg">
      <h1 className="text-my-stone text-xs uppercase tracking-widest mb-pad-2">Writing</h1>

      <ul className="flex flex-col gap-0">
        {essays.map((essay) => (
          <li key={essay.slug} className="border-b border-my-espresso/30 last:border-0">
            <Link
              href={`/writing/${essay.slug}`}
              className="group flex flex-col gap-1 py-5"
            >
              <span className="text-my-cream text-sm group-hover:text-my-orange transition-colors">
                {essay.metadata.title}
              </span>
              <span className="text-my-stone text-xs leading-relaxed">
                {essay.metadata.description}
              </span>
              <span className="text-my-stone/50 text-xs mt-1">
                {formatDate(essay.metadata.date)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
