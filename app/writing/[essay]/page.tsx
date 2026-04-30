import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getEssay, getAllEssays } from '@/lib/content';
import { formatDate } from '@/lib/utils';

export async function generateStaticParams() {
  return getAllEssays().map((e) => ({ essay: e.slug }));
}

function readTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 238));
  return `${minutes} min read`;
}

export async function generateMetadata({ params }: { params: Promise<{ essay: string }> }) {
  const { essay: essaySlug } = await params;
  const essay = getEssay(essaySlug);
  if (!essay) return {};
  return {
    title: `${essay.metadata.title} — Jered Leisey`,
    description: essay.metadata.description,
  };
}

export default async function EssayPage({ params }: { params: Promise<{ essay: string }> }) {
  const { essay: essaySlug } = await params;
  const essay = getEssay(essaySlug);
  if (!essay) notFound();

  return (
    <div className="p-pad-2 max-w-2xl">
      <div className="mb-8">
        <p className="text-my-stone text-xs uppercase tracking-widest mb-3">
          {formatDate(essay.metadata.date)} · {readTime(essay.content)}
        </p>
        <h1 className="text-my-cream text-2xl font-light leading-snug">
          {essay.metadata.title}
        </h1>
      </div>

      <div className="prose prose-invert prose-sm max-w-none
        prose-headings:font-light prose-headings:text-my-cream
        prose-p:text-my-stone prose-p:leading-relaxed
        prose-a:text-my-orange prose-a:no-underline hover:prose-a:text-my-cream
        prose-strong:text-my-cream prose-strong:font-normal
        prose-code:text-my-amber prose-code:bg-my-espresso/50 prose-code:px-1 prose-code:rounded
        prose-pre:bg-my-espresso/50 prose-pre:border prose-pre:border-my-espresso/30">
        <MDXRemote source={essay.content} />
      </div>
    </div>
  );
}
