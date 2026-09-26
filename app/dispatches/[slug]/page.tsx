import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote-client/rsc';
import { getPost, getPosts } from '@/lib/content';
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

// One facet of a Post as small tags. Each tag links to the Dispatches list filtered by it.
function FacetTags({ label, param, values }: { label: string; param: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <p className="mt-3 flex flex-wrap items-baseline gap-2 text-xs text-my-walnut dark:text-my-stone">
      <span className="uppercase tracking-widest">{label}</span>
      {values.map((value) => (
        <Link
          key={value}
          href={`/dispatches?${new URLSearchParams({ [param]: value })}`}
          className="border border-my-stone/40 dark:border-my-stone/20 px-2 py-0.5 font-light hover:border-my-orange hover:text-my-orange transition-colors"
        >
          {value}
        </Link>
      ))}
    </p>
  );
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug, { includeDrafts });
  if (!post) notFound();

  return (
    <div className="p-pad-2 max-w-2xl">
      <div className="mb-8">
        <p className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-3">
          {formatDate(post.date)}
          {post.draft && <span className="text-my-orange"> · Draft</span>}
        </p>
        <h1 className="text-my-espresso dark:text-my-cream text-2xl font-light leading-snug">{post.title}</h1>
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
        <FacetTags label="Topics" param="topic" values={post.topics} />
        <FacetTags label="Audience" param="audience" values={post.audience} />
        <FacetTags label="Use cases" param="useCase" values={post.useCases} />
      </div>

      <div className={proseClasses}>
        <MDXRemote source={post.content} />
      </div>
    </div>
  );
}
