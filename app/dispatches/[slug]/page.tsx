import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReadingTransition } from '@/components/PageTransitions';
import { MDXRemote } from 'next-mdx-remote-client/rsc';
import { getPost, getPosts, getSeries, getSeriesPart } from '@/lib/content';
// PROTOTYPE (reading pages): the variants and the switcher never go to main.
import { PrototypeSwitcher } from '@/components/PrototypeSwitcher';
import { VARIANTS, wordCount, type ReadingDoc } from '@/app/_prototype-reading/doc';
import { VariantA } from '@/app/_prototype-reading/VariantA';
import { VariantB } from '@/app/_prototype-reading/VariantB';
import { VariantC } from '@/app/_prototype-reading/VariantC';
import { formatDate } from '@/lib/format';
import { proseClasses } from '@/lib/proseClasses';

// Drafts show only while Jered runs the site in development. The build lists only
// published Posts, and a slug that is not listed is a 404, so a Draft gets no page.
const includeDrafts = process.env.NODE_ENV === 'development';

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ variant?: string }> };

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

export default async function PostPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const post = getPost(slug, { includeDrafts });
  if (!post) notFound();
  const part = getSeriesPart(slug, { includeDrafts });

  const raw = (await searchParams).variant;
  const variant = VARIANTS.some((v) => v.key === raw) ? raw! : 'A';
  if (variant !== '0') {
    const words = wordCount(post.content);
    const series = part ? getSeries(part.series.slug, { includeDrafts }) : null;
    const doc: ReadingDoc = {
      kind: 'post',
      kindLabel: 'Dispatch',
      title: post.title,
      description: post.description,
      date: post.date,
      draft: post.draft,
      words,
      minutes: Math.max(1, Math.round(words / 230)),
      series: part && series
        ? {
            slug: part.series.slug,
            title: part.series.title,
            part: part.part,
            parts: part.parts,
            posts: series.posts.map((p) => ({ slug: p.slug, title: p.title, current: p.slug === post.slug })),
            previous: part.previous ? { slug: part.previous.slug, title: part.previous.title } : undefined,
            next: part.next ? { slug: part.next.slug, title: part.next.title } : undefined,
          }
        : undefined,
      project: post.project ? { slug: post.project.slug, title: post.project.title } : undefined,
      facets: [
        { label: 'Topics', param: 'topic', values: post.topics },
        { label: 'Audience', param: 'audience', values: post.audience },
        { label: 'Use cases', param: 'useCase', values: post.useCases },
      ],
      body: (
        <div className={proseClasses}>
          <MDXRemote source={post.content} />
        </div>
      ),
    };
    const V = { A: VariantA, B: VariantB, C: VariantC }[variant as 'A' | 'B' | 'C'];
    return (
      <ReadingTransition>
        <>
          <V doc={doc} />
          <PrototypeSwitcher variants={VARIANTS} current={variant} />
        </>
      </ReadingTransition>
    );
  }

  return (
    <ReadingTransition>
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
          <FacetTags label="Topics" param="topic" values={post.topics} />
          <FacetTags label="Audience" param="audience" values={post.audience} />
          <FacetTags label="Use cases" param="useCase" values={post.useCases} />
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
    </ReadingTransition>
  );
}
