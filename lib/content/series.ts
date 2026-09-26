import fs from 'fs';
import path from 'path';
import { ContentError, optionalString, readMdxFile, requiredString } from './frontmatter';
import { DEFAULT_CONTENT_DIR, getPost, getPosts, type Post, type PostOptions } from './posts';

// An ordered set of Posts that are meant to be read one after the other. A Series
// is defined by the Posts that name it. An optional series file at
// dispatches/series/<slug>.mdx gives it a title and a description.
export interface Series {
  slug: string;
  title: string;
  description?: string;
  // In order of position.
  posts: Post[];
}

// Where one Post sits in its Series. The part number counts the visible Posts, so
// a hidden Draft leaves no gap.
export interface SeriesPart {
  series: Series;
  part: number;
  parts: number;
  previous: Post | null;
  next: Post | null;
}

export function getSeries(slug: string, options: PostOptions = {}): Series | null {
  const posts = getPosts(options)
    .filter((p) => p.series === slug)
    .sort((a, b) => (a.seriesPosition ?? 0) - (b.seriesPosition ?? 0));
  if (posts.length === 0) return null;
  const contentDir = options.contentDir ?? DEFAULT_CONTENT_DIR;
  checkPositions(slug, posts, contentDir);
  return { slug, ...seriesInfo(slug, contentDir), posts };
}

// The place of a Post in its Series, or nothing when the Post is not visible or is
// in no Series.
export function getSeriesPart(postSlug: string, options: PostOptions = {}): SeriesPart | null {
  const post = getPost(postSlug, options);
  if (!post?.series) return null;
  const series = getSeries(post.series, options);
  if (!series) return null;
  const index = series.posts.findIndex((p) => p.slug === postSlug);
  return {
    series,
    part: index + 1,
    parts: series.posts.length,
    previous: series.posts[index - 1] ?? null,
    next: series.posts[index + 1] ?? null,
  };
}

// Every Series that a visible Post names, in order of slug.
export function getAllSeries(options: PostOptions = {}): Series[] {
  const slugs = new Set(getPosts(options).flatMap((p) => (p.series ? [p.series] : [])));
  return [...slugs]
    .sort()
    .map((slug) => getSeries(slug, options))
    .filter((s): s is Series => s !== null);
}

// Two Posts at one position make the reading order ambiguous. The Posts are in
// order of position, so a repeat sits next to the Post it repeats.
function checkPositions(slug: string, posts: Post[], contentDir: string) {
  const postFile = (post: Post) => path.join(contentDir, 'dispatches', `${post.slug}.mdx`);
  for (let i = 1; i < posts.length; i++) {
    const [a, b] = [posts[i - 1], posts[i]];
    if (a.seriesPosition === b.seriesPosition) {
      throw new ContentError(
        postFile(a),
        `seriesPosition ${a.seriesPosition} in Series "${slug}" is also used by ` +
          path.relative(process.cwd(), postFile(b)),
      );
    }
  }
}

// The slug here always comes from a Post that names the Series, never from a URL.
function seriesInfo(slug: string, contentDir: string): Pick<Series, 'title' | 'description'> {
  const filePath = path.join(contentDir, 'dispatches', 'series', `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return { title: titleFromSlug(slug) };
  const file = readMdxFile(filePath);
  return { title: requiredString(file, 'title'), description: optionalString(file, 'description') };
}

// claude-basics becomes "Claude Basics".
function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
