import fs from 'fs';
import path from 'path';
import { getProject, type Project } from '@/lib/projects';
import {
  ContentError,
  optionalBoolean,
  optionalString,
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
  content: string;
}

export interface PostOptions {
  contentDir?: string;
  includeDrafts?: boolean;
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

function projectOf(file: MdxFile): Project | undefined {
  const slug = optionalString(file, 'project');
  if (slug === undefined) return undefined;
  const project = getProject(slug);
  if (!project) {
    throw new ContentError(file.filePath, `project "${slug}" is not in the Project registry`);
  }
  return project;
}

export function getPosts({
  contentDir = DEFAULT_CONTENT_DIR,
  includeDrafts = false,
}: PostOptions = {}): Post[] {
  return postFiles(contentDir)
    .map(readPost)
    .filter((p) => includeDrafts || !p.draft)
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
