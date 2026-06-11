// lib/types.ts

export interface SeriesMetadata {
  title: string;
  level: 101 | 201;
  description: string;
  status: 'active' | 'complete' | 'coming-soon';
}

export interface LessonMetadata {
  title: string;
  order: number;
  description?: string;
}

export interface ProjectMetadata {
  title: string;
  date: string; // ISO date string e.g. "2026-04-30"
  description: string;
  lessons: string[]; // "[series-slug]/[lesson-slug]" without order prefix
}

export interface EssayMetadata {
  title: string;
  date: string; // ISO date string
  description: string;
}

export interface LessonSummary {
  slug: string; // URL slug, no order prefix
  metadata: LessonMetadata;
}

export interface SeriesWithLessons {
  slug: string;
  metadata: SeriesMetadata;
  lessons: LessonSummary[];
}

export interface ProjectSummary {
  slug: string;
  metadata: ProjectMetadata;
}

export interface EssaySummary {
  slug: string;
  metadata: EssayMetadata;
}

export interface LessonRef {
  seriesSlug: string;
  lessonSlug: string;
  lessonTitle: string;
  level: 101 | 201;
  href: string; // "/learn/[seriesSlug]/[lessonSlug]"
}

export interface LessonPage {
  seriesSlug: string;
  lessonSlug: string;
  seriesTitle: string;
  totalLessons: number;
  metadata: LessonMetadata;
  content: string; // raw MDX without frontmatter
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}

export interface ProjectPage {
  slug: string;
  metadata: ProjectMetadata;
  content: string;
  lessonRefs: LessonRef[];
}

export interface EssayPage {
  slug: string;
  metadata: EssayMetadata;
  content: string;
}

export interface DialogueMetadata {
  title: string;
  model: string; // e.g. "Fable 5", "Opus 4.8"
  date: string; // ISO date string
  summary: string;
}

export interface DialogueSummary {
  slug: string;
  metadata: DialogueMetadata;
}

export interface DialoguePage {
  slug: string;
  metadata: DialogueMetadata;
  content: string; // raw MDX without frontmatter
}
