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

const DEFAULT_CONTENT_DIR = path.join(process.cwd(), 'content');

export interface Post {
  slug: string;
  title: string;
  date: Date;
  description: string;
  // The Project that the Post is about, from the Project registry.
  project?: Project;
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
    draft: optionalBoolean(file, 'draft'),
    content: file.content,
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
