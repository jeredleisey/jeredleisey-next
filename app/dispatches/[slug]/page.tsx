import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote-client/rsc';
import { getPost, getPosts, getSeriesPart } from '@/lib/content';
import { formatDate } from '@/lib/format';
import { proseClasses } from '@/lib/proseClasses';

// Drafts show only while Jered runs the site in development. The build lists only
// published Posts, and a slug that is not listed is a 404, so a Draft gets no page.
const includeDrafts = process.env.NODE_ENV === 'development';

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPosts({ includeDrafts }).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug, { includeDrafts });
  if (!post) return {};
  return { title: `${post.title} — Jered Leisey`, description: post.description };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug, { includeDrafts });
  if (!post) notFound();
  const part = getSeriesPart(slug, { includeDrafts });

  return (
    <div className="p-pad-2 max-w-2xl">
      <div className="mb-8">
        <p className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-3">
          {formatDate(post.date)}
          {post.draft && <span className="text-my-orange"> · Draft</span>}
        </p>
        <h1 className="text-my-espresso dark:text-my-cream text-2xl font-light leading-snug">{post.title}</h1>
        {part && (
          <p className="mt-3 text-xs">
            <Link href={`/dispatches/series/${part.series.slug}`} className="group">
              <span className="uppercase tracking-widest text-my-walnut dark:text-my-stone group-hover:text-my-orange transition-colors">
                Part {part.part} of {part.parts}
              </span>{' '}
              <span className="text-my-orange group-hover:text-my-espresso dark:group-hover:text-my-cream transition-colors">
                {part.series.title}
              </span>
            </Link>
          </p>
        )}
        {post.project && (
          <p className="mt-3 text-xs text-my-walnut dark:text-my-stone">
            <span className="uppercase tracking-widest">Project</span>{' '}
            <Link
              href={`/projects/${post.project.slug}`}
              className="text-my-orange hover:text-my-espresso dark:hover:text-my-cream transition-colors"
            >
              {post.project.title}
            </Link>
          </p>
        )}
      </div>

      <div className={proseClasses}>
        <MDXRemote source={post.content} />
      </div>

      {part && (part.previous || part.next) && (
        <nav
          aria-label={`${part.series.title} Series`}
          className="mt-pad-2 pt-5 border-t border-my-stone/30 dark:border-my-espresso/30 grid grid-cols-2 gap-5"
        >
          {part.previous ? (
            <Link href={`/dispatches/${part.previous.slug}`} className="group flex flex-col gap-1">
              <span className="text-my-walnut/60 dark:text-my-stone/60 text-xs uppercase tracking-widest">
                ← Previous
              </span>
              <span className="text-my-espresso dark:text-my-cream text-sm group-hover:text-my-orange transition-colors">
                {part.previous.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {part.next && (
            <Link href={`/dispatches/${part.next.slug}`} className="group flex flex-col gap-1 text-right">
              <span className="text-my-walnut/60 dark:text-my-stone/60 text-xs uppercase tracking-widest">
                Next →
              </span>
              <span className="text-my-espresso dark:text-my-cream text-sm group-hover:text-my-orange transition-colors">
                {part.next.title}
              </span>
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
