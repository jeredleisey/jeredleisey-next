import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type {
  SeriesMetadata,
  LessonMetadata,
  ProjectMetadata,
  EssayMetadata,
  LessonSummary,
  SeriesWithLessons,
  ProjectSummary,
  EssaySummary,
  LessonPage,
  ProjectPage,
  LessonRef,
  EssayPage,
} from './types';

const DEFAULT_CONTENT_DIR = path.join(process.cwd(), 'content');

function readMdx(filePath: string): { data: unknown; content: string } {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return matter(raw);
}

// Strips "01-" prefix from lesson filenames to produce the URL slug
function lessonSlugFromFilename(filename: string): string {
  return filename.replace(/^\d+-/, '').replace(/\.mdx$/, '');
}

// ── series + lessons ──────────────────────────────────────────────────────────

export function getAllSeries(contentDir = DEFAULT_CONTENT_DIR): SeriesWithLessons[] {
  const learnDir = path.join(contentDir, 'learn');
  const seriesDirs = fs
    .readdirSync(learnDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  return seriesDirs
    .map((seriesSlug) => {
      const seriesDir = path.join(learnDir, seriesSlug);
      const { data } = readMdx(path.join(seriesDir, '_series.mdx'));

      const lessons: LessonSummary[] = fs
        .readdirSync(seriesDir)
        .filter((f) => f.endsWith('.mdx') && !f.startsWith('_'))
        .sort()
        .map((filename) => {
          const { data: lessonData } = readMdx(path.join(seriesDir, filename));
          return {
            slug: lessonSlugFromFilename(filename),
            metadata: lessonData as LessonMetadata,
          };
        });

      return { slug: seriesSlug, metadata: data as SeriesMetadata, lessons };
    })
    .sort(
      (a, b) =>
        a.metadata.level - b.metadata.level ||
        a.metadata.title.localeCompare(b.metadata.title),
    );
}

export function getSeries(
  seriesSlug: string,
  contentDir = DEFAULT_CONTENT_DIR,
): SeriesWithLessons | null {
  return getAllSeries(contentDir).find((s) => s.slug === seriesSlug) ?? null;
}

export function getLesson(
  seriesSlug: string,
  lessonSlug: string,
  contentDir = DEFAULT_CONTENT_DIR,
): LessonPage | null {
  const series = getSeries(seriesSlug, contentDir);
  if (!series) return null;

  const idx = series.lessons.findIndex((l) => l.slug === lessonSlug);
  if (idx === -1) return null;

  const seriesDir = path.join(contentDir, 'learn', seriesSlug);
  const files = fs
    .readdirSync(seriesDir)
    .filter((f) => f.endsWith('.mdx') && !f.startsWith('_'))
    .sort();

  const { data, content } = readMdx(path.join(seriesDir, files[idx]));

  const prev =
    idx > 0
      ? { slug: series.lessons[idx - 1].slug, title: series.lessons[idx - 1].metadata.title }
      : null;
  const next =
    idx < series.lessons.length - 1
      ? { slug: series.lessons[idx + 1].slug, title: series.lessons[idx + 1].metadata.title }
      : null;

  return {
    seriesSlug,
    lessonSlug,
    seriesTitle: series.metadata.title,
    totalLessons: series.lessons.length,
    metadata: data as LessonMetadata,
    content,
    prev,
    next,
  };
}
