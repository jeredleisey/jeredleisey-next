import Link from 'next/link';
import { getPosts } from '@/lib/content';
import { formatDate } from '@/lib/format';

export const metadata = { title: 'Dispatches — Jered Leisey' };

// Drafts show only while Jered runs the site in development.
const includeDrafts = process.env.NODE_ENV === 'development';

export default function DispatchesPage() {
  const posts = getPosts({ includeDrafts });

  return (
    <div className="p-pad-2 max-w-lg">
      <h1 className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-pad-2">Dispatches</h1>

      {posts.length === 0 ? (
        <p className="text-my-walnut dark:text-my-stone text-sm font-light">No Posts yet.</p>
      ) : (
        <ul className="flex flex-col gap-0">
          {posts.map((post) => (
            <li key={post.slug} className="border-b border-my-stone/30 dark:border-my-espresso/30 last:border-0">
              <Link href={`/dispatches/${post.slug}`} className="group flex flex-col gap-1 py-5">
                <span className="text-my-walnut/60 dark:text-my-stone/60 text-xs uppercase tracking-widest">
                  {formatDate(post.date)}
                  {post.draft && <span className="text-my-orange"> · Draft</span>}
                </span>
                <span className="text-my-espresso dark:text-my-cream text-sm group-hover:text-my-orange transition-colors">
                  {post.title}
                </span>
                <span className="text-my-walnut dark:text-my-stone text-xs leading-relaxed">
                  {post.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
