import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getLesson, getAllSeries } from '@/lib/content';
import { LessonNav } from '@/components/LessonNav';
import { proseClasses } from '@/lib/proseClasses';

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

      <div className={proseClasses}>
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
