import fs from 'fs';
import path from 'path';
import {
  ContentError,
  optionalBoolean,
  optionalString,
  readMdxFile,
  type MdxFile,
  requiredDate,
} from './frontmatter';

const DEFAULT_CONTENT_DIR = path.join(process.cwd(), 'content');

// A photo is a file in public/life/, and src is its path on the site, such as
// /life/hike.jpg. The frontmatter gives its width and height in pixels, because
// next/image needs them for a path that is not a static import. On a Mac,
// `sips -g pixelWidth -g pixelHeight <file>` prints both.
export interface Photo {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface UpdateLink {
  url: string;
  label?: string;
}

export interface Update {
  slug: string;
  date: Date;
  title?: string;
  photos: Photo[];
  link?: UpdateLink;
  draft: boolean;
  // The MDX body is the text of the Update.
  content: string;
}

export interface UpdateOptions {
  contentDir?: string;
  includeDrafts?: boolean;
}

// Every Update file in the content folder. A slug only ever comes from this list,
// so a slug from a URL never reaches the file system.
function updateFiles(contentDir: string): string[] {
  const dir = path.join(contentDir, 'life');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => path.join(dir, f));
}

function readUpdate(filePath: string): Update {
  const file = readMdxFile(filePath);
  return {
    slug: path.basename(filePath, '.mdx'),
    date: requiredDate(file, 'date'),
    title: optionalString(file, 'title'),
    photos: photosOf(file),
    link: linkOf(file),
    draft: optionalBoolean(file, 'draft'),
    content: file.content,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// A file in public/life/, which the site serves at /life/. A ".." part could reach
// out of that folder, so it is not allowed.
function isLifePath(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('/life/') &&
    value.length > '/life/'.length &&
    !value.split('/').includes('..')
  );
}

function photosOf(file: MdxFile): Photo[] {
  const value = file.data.photos;
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || !value.every(isRecord)) {
    throw new ContentError(file.filePath, '"photos" must be a list of photos, each with "src" and "alt"');
  }
  return value.map((photo, i) => {
    const problem = (text: string) => new ContentError(file.filePath, `photo ${i + 1} ${text}`);
    if (typeof photo.alt !== 'string' || photo.alt.trim() === '') {
      throw problem('needs "alt" text');
    }
    if (!isLifePath(photo.src)) {
      throw problem('"src" must be a path under /life/, such as /life/hike.jpg');
    }
    for (const side of ['width', 'height'] as const) {
      const size = photo[side];
      if (typeof size !== 'number' || !Number.isInteger(size) || size <= 0) {
        throw problem(`"${side}" must be a whole number of pixels`);
      }
    }
    return {
      src: photo.src,
      alt: photo.alt,
      width: photo.width as number,
      height: photo.height as number,
    };
  });
}

function linkOf(file: MdxFile): UpdateLink | undefined {
  const value = file.data.link;
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value) || !isWebUrl(value.url)) {
    throw new ContentError(
      file.filePath,
      '"link" needs a "url" that starts with http:// or https://',
    );
  }
  const { label } = value;
  if (label !== undefined && label !== null && (typeof label !== 'string' || label.trim() === '')) {
    throw new ContentError(file.filePath, '"link" "label" must be text');
  }
  return { url: value.url, label: label ?? undefined };
}

// Only a web address is allowed, so a link can never run script (javascript:).
function isWebUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

export function getUpdates({
  contentDir = DEFAULT_CONTENT_DIR,
  includeDrafts = false,
}: UpdateOptions = {}): Update[] {
  return updateFiles(contentDir)
    .map(readUpdate)
    .filter((u) => includeDrafts || !u.draft)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function getUpdate(
  slug: string,
  { contentDir = DEFAULT_CONTENT_DIR, includeDrafts = false }: UpdateOptions = {},
): Update | null {
  const file = updateFiles(contentDir).find((f) => path.basename(f, '.mdx') === slug);
  if (!file) return null;
  const update = readUpdate(file);
  return includeDrafts || !update.draft ? update : null;
}
