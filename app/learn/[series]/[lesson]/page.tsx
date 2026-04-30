import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getLesson, getAllSeries } from '@/lib/content';
import { LessonNav } from '@/components/LessonNav';

export async function generateStaticParams() {
  const allSeries = getAllSeries();
  return allSeries.flatMap((series) =>
    series.lessons.map((lesson) => ({
      series: series.slug,
      lesson: lesson.slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ series: string; lesson: string }>;
}) {
  const { series: seriesSlug, lesson: lessonSlug } = await params;
  const lesson = getLesson(seriesSlug, lessonSlug);
  if (!lesson) return {};
  return {
    title: `${lesson.metadata.title} — Jered Leisey`,
    description: lesson.metadata.description,
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ series: string; lesson: string }>;
}) {
  const { series: seriesSlug, lesson: lessonSlug } = await params;
  const lesson = getLesson(seriesSlug, lessonSlug);
  if (!lesson) notFound();

  return (
    <div className="p-pad-2 max-w-2xl">
      <div className="mb-8">
        <p className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-3">
          Lesson {lesson.metadata.order} of {lesson.totalLessons}
        </p>
        <h1 className="text-my-espresso dark:text-my-cream text-2xl font-light leading-snug">
          {lesson.metadata.title}
        </h1>
      </div>

      <div className="prose prose-sm max-w-none
        prose-headings:font-light prose-headings:text-my-espresso dark:prose-headings:text-my-cream
        prose-p:text-my-walnut dark:prose-p:text-my-stone prose-p:leading-relaxed
        prose-a:text-my-orange prose-a:no-underline hover:prose-a:text-my-espresso dark:hover:prose-a:text-my-cream
        prose-strong:text-my-espresso dark:prose-strong:text-my-cream prose-strong:font-normal
        prose-code:text-my-amber prose-code:bg-my-stone/20 dark:prose-code:bg-my-espresso/50 prose-code:px-1 prose-code:rounded
        prose-pre:bg-my-stone/20 dark:prose-pre:bg-my-espresso/50 prose-pre:border prose-pre:border-my-stone/30 dark:prose-pre:border-my-espresso/30">
        <MDXRemote source={lesson.content} />
      </div>

      <LessonNav
        seriesSlug={seriesSlug}
        prev={lesson.prev}
        next={lesson.next}
      />
    </div>
  );
}
