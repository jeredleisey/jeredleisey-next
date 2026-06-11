import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getEssay, getAllEssays } from '@/lib/content';
import { formatDate } from '@/lib/utils';
import { proseClasses } from '@/lib/proseClasses';

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
        <p className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-3">
          {formatDate(essay.metadata.date)} · {readTime(essay.content)}
        </p>
        <h1 className="text-my-espresso dark:text-my-cream text-2xl font-light leading-snug">
          {essay.metadata.title}
        </h1>
      </div>

      <div className={proseClasses}>
        <MDXRemote source={essay.content} />
      </div>
    </div>
  );
}
