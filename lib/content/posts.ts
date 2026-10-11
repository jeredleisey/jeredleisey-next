import fs from 'fs';
import path from 'path';
import { getProject, type Project } from '@/lib/projects';
import {
  ContentError,
  optionalBoolean,
  optionalString,
  optionalStringList,
  readMdxFile,
  type MdxFile,
  requiredDate,
  requiredString,
} from './frontmatter';

export const DEFAULT_CONTENT_DIR = path.join(process.cwd(), 'content');

export interface Post {
  slug: string;
  title: string;
  date: Date;
  description: string;
  // The Project that the Post is about, from the Project registry.
  project?: Project;
  // The Series that the Post belongs to, and its place in that Series.
  series?: string;
  seriesPosition?: number;
  draft: boolean;
  // Facets: the topics, audience, and use cases of a Post. Each is a list, empty when missing.
  topics: string[];
  audience: string[];
  useCases: string[];
  content: string;
}

export interface PostOptions {
  contentDir?: string;
  includeDrafts?: boolean;
}

// getPosts filters by one value per facet. A Post matches when that facet holds the
// value. Filters combine: a Post must match every filter that is given.
export interface PostFilters {
  topic?: string;
  audience?: string;
  useCase?: string;
}

// Every Post file in the content folder. A slug only ever comes from this list,
// so a slug from a URL never reaches the file system.
function postFiles(contentDir: string): string[] {
  const dir = path.join(contentDir, 'dispatches');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => path.join(dir, f));
}

function readPost(filePath: string): Post {
  const file = readMdxFile(filePath);
  return {
    slug: path.basename(filePath, '.mdx'),
    title: requiredString(file, 'title'),
    date: requiredDate(file, 'date'),
    description: requiredString(file, 'description'),
    project: projectOf(file),
    ...seriesOf(file),
    draft: optionalBoolean(file, 'draft'),
    ...facetsOf(file),
    content: file.content,
  };
}

function seriesOf(file: MdxFile): Pick<Post, 'series' | 'seriesPosition'> {
  const series = optionalString(file, 'series');
  if (series === undefined) return {};
  // The slug becomes a URL segment and the name of the series file.
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(series)) {
    throw new ContentError(
      file.filePath,
      '"series" must be a slug of lowercase letters, digits, and hyphens',
    );
  }
  const position = file.data.seriesPosition;
  if (position === undefined || position === null) {
    throw new ContentError(file.filePath, '"seriesPosition" is required when "series" is set');
  }
  if (typeof position !== 'number' || !Number.isInteger(position) || position < 1) {
    throw new ContentError(file.filePath, '"seriesPosition" must be a whole number of 1 or more');
  }
  return { series, seriesPosition: position };
}

function facetsOf(file: MdxFile): Pick<Post, 'topics' | 'audience' | 'useCases'> {
  return {
    topics: optionalStringList(file, 'topics'),
    audience: optionalStringList(file, 'audience'),
    useCases: optionalStringList(file, 'useCases'),
  };
}

function projectOf(file: MdxFile): Project | undefined {
  const slug = optionalString(file, 'project');
  if (slug === undefined) return undefined;
  const project = getProject(slug);
  if (!project) {
    throw new ContentError(file.filePath, `project "${slug}" is not in the Project registry`);
  }
  return project;
}

function matchesFilters(post: Post, { topic, audience, useCase }: PostFilters): boolean {
  return (
    (topic === undefined || post.topics.includes(topic)) &&
    (audience === undefined || post.audience.includes(audience)) &&
    (useCase === undefined || post.useCases.includes(useCase))
  );
}

export function getPosts({
  contentDir = DEFAULT_CONTENT_DIR,
  includeDrafts = false,
  ...filters
}: PostOptions & PostFilters = {}): Post[] {
  return postFiles(contentDir)
    .map(readPost)
    .filter((p) => includeDrafts || !p.draft)
    .filter((p) => matchesFilters(p, filters))
    .sort(newestFirst);
}

// Newest first. A date has no time of day, so Posts of one day need a second rule:
// the Posts of one Series stay together with the last part first, and all other
// Posts go by slug. Without it, the order of the files on disk decides.
function newestFirst(a: Post, b: Post): number {
  const days = b.date.getTime() - a.date.getTime();
  if (days !== 0) return days;
  const group = (a.series ?? a.slug).localeCompare(b.series ?? b.slug);
  if (group !== 0) return group;
  return (b.seriesPosition ?? 0) - (a.seriesPosition ?? 0) || a.slug.localeCompare(b.slug);
}

export function getPost(
  slug: string,
  { contentDir = DEFAULT_CONTENT_DIR, includeDrafts = false }: PostOptions = {},
): Post | null {
  const file = postFiles(contentDir).find((f) => path.basename(f, '.mdx') === slug);
  if (!file) return null;
  const post = readPost(file);
  return includeDrafts || !post.draft ? post : null;
}

// The distinct facet values that Posts use, for the filter controls.
export interface Facets {
  topics: string[];
  audiences: string[];
  useCases: string[];
}

function distinctSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function getFacets({ contentDir, includeDrafts }: PostOptions = {}): Facets {
  const posts = getPosts({ contentDir, includeDrafts });
  return {
    topics: distinctSorted(posts.flatMap((p) => p.topics)),
    audiences: distinctSorted(posts.flatMap((p) => p.audience)),
    useCases: distinctSorted(posts.flatMap((p) => p.useCases)),
  };
}

// One facet value and the number of Posts that use it.
export interface FacetCount {
  value: string;
  count: number;
}

export interface FacetCounts {
  topics: FacetCount[];
  audiences: FacetCount[];
  useCases: FacetCount[];
}

// The most used value first, then by name.
function counted(values: string[]): FacetCount[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

// A Post that names one value two times counts one time.
export function getFacetCounts({ contentDir, includeDrafts }: PostOptions = {}): FacetCounts {
  const posts = getPosts({ contentDir, includeDrafts });
  return {
    topics: counted(posts.flatMap((p) => [...new Set(p.topics)])),
    audiences: counted(posts.flatMap((p) => [...new Set(p.audience)])),
    useCases: counted(posts.flatMap((p) => [...new Set(p.useCases)])),
  };
}

// The filter controls show a value only when this many Posts use it, and only this
// many values. Most values are on one Post, and a control for each one is noise.
const SHOWN_MIN_POSTS = 2;
const SHOWN_MAX = 6;

// Splits the values of one facet, most used first, into the values that the filter
// controls show and the values that they keep back. The active value always shows.
// When no value is on enough Posts, the most used values show.
export function splitFacet(counts: FacetCount[], active?: string): { shown: FacetCount[]; more: FacetCount[] } {
  const common = counts.filter((c) => c.count >= SHOWN_MIN_POSTS);
  const top = new Set((common.length > 0 ? common : counts).slice(0, SHOWN_MAX).map((c) => c.value));
  const isShown = (c: FacetCount) => top.has(c.value) || c.value === active;
  return { shown: counts.filter(isShown), more: counts.filter((c) => !isShown(c)) };
}
