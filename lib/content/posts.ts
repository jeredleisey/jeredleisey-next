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

const DEFAULT_CONTENT_DIR = path.join(process.cwd(), 'content');

export interface Post {
  slug: string;
  title: string;
  date: Date;
  description: string;
  // The Project that the Post is about, from the Project registry.
  project?: Project;
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
    draft: optionalBoolean(file, 'draft'),
    ...facetsOf(file),
    content: file.content,
  };
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
    .sort((a, b) => b.date.getTime() - a.date.getTime());
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
