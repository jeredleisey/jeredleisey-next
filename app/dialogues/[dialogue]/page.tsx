import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getDialogue, getAllDialogues } from '@/lib/content';
import { formatDate } from '@/lib/utils';
import { Turn, Note, Preface, Afterword } from '@/components/Dialogue';

const dialogueComponents = { Turn, Note, Preface, Afterword };

export async function generateStaticParams() {
  return getAllDialogues().map((d) => ({ dialogue: d.slug }));
}

function turnCount(src: string): number {
  return (src.match(/<Turn\b/g) ?? []).length;
}

export async function generateMetadata({ params }: { params: Promise<{ dialogue: string }> }) {
  const { dialogue: slug } = await params;
  const dialogue = getDialogue(slug);
  if (!dialogue) return {};
  return {
    title: `${dialogue.metadata.title} — Jered Leisey`,
    description: dialogue.metadata.summary,
  };
}

export default async function DialoguePage({ params }: { params: Promise<{ dialogue: string }> }) {
  const { dialogue: slug } = await params;
  const dialogue = getDialogue(slug);
  if (!dialogue) notFound();
  const { metadata, content } = dialogue;

  return (
    <article className="p-pad-2 max-w-4xl">
      <p className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest">
        Dialogues
      </p>
      <h1 className="mt-3 text-my-espresso dark:text-my-cream text-4xl font-light leading-tight max-w-[18ch]">
        {metadata.title}
      </h1>
      <p className="mt-4 text-my-walnut dark:text-my-stone text-xs uppercase tracking-wide">
        {metadata.model} · {formatDate(metadata.date)} · {turnCount(content)} turns ·{' '}
        <span className="text-my-orange">unedited transcript</span>
      </p>
      <hr className="mt-7 border-0 h-px bg-my-espresso dark:bg-my-stone/40" />
      <div className="mt-2">
        <MDXRemote source={content} components={dialogueComponents} />
      </div>
    </article>
  );
}
