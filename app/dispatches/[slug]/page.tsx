import { notFound } from 'next/navigation';
import { ReadingTransition } from '@/components/PageTransitions';
import { MDXRemote } from 'next-mdx-remote-client/rsc';
import { ReadingLayout } from '@/components/reading/ReadingLayout';
import { getPost, getPosts, getSeries, getSeriesPart, readingMinutes } from '@/lib/content';
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

  const series = part ? getSeries(part.series.slug, { includeDrafts }) : null;

  return (
    <ReadingTransition>
      <ReadingLayout
        kindLabel="Dispatch"
        slug={post.slug}
        date={post.date}
        draft={post.draft}
        minutes={readingMinutes(post.content)}
        title={post.title}
        description={post.description}
        series={
          part && series
            ? {
                slug: part.series.slug,
                title: part.series.title,
                part: part.part,
                posts: series.posts.map((p) => ({ slug: p.slug, title: p.title })),
                previous: part.previous && { slug: part.previous.slug, title: part.previous.title },
                next: part.next && { slug: part.next.slug, title: part.next.title },
              }
            : null
        }
        project={post.project}
        facets={[
          { label: 'Topics', param: 'topic', values: post.topics },
          { label: 'Audience', param: 'audience', values: post.audience },
          { label: 'Use cases', param: 'useCase', values: post.useCases },
        ]}
      >
        <div className={proseClasses}>
          <MDXRemote source={post.content} />
        </div>
      </ReadingLayout>
    </ReadingTransition>
  );
}
