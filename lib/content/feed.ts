import { PROJECTS, type Project } from '@/lib/projects';
import { getPosts, type PostOptions } from './posts';
import { getUpdates } from './updates';

export type FeedKind = 'project' | 'post' | 'update';

export interface FeedItem {
  kind: FeedKind;
  slug: string;
  href: string;
  // An Update may have no title.
  title?: string;
  summary: string;
  date: Date;
}

export interface FeedOptions extends PostOptions {
  limit?: number;
  // The Project registry by default. Tests pass their own Projects.
  projects?: readonly Project[];
}

const EXCERPT_LENGTH = 160;

// A short plain-text summary of an Update's MDX body.
function excerpt(mdx: string): string {
  const text = mdx
    .replace(/<[^>]+>/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length <= EXCERPT_LENGTH ? text : `${text.slice(0, EXCERPT_LENGTH).trimEnd()}…`;
}

// The latest items across Projects, Posts, and Updates, newest first.
export function getFeed({ contentDir, includeDrafts, limit, projects = PROJECTS }: FeedOptions = {}): FeedItem[] {
  const items: FeedItem[] = [
    ...projects.map((p) => ({
      kind: 'project' as const,
      slug: p.slug,
      href: `/projects/${p.slug}`,
      title: p.title,
      summary: p.description,
      date: new Date(`${p.date}T00:00:00Z`),
    })),
    ...getPosts({ contentDir, includeDrafts }).map((p) => ({
      kind: 'post' as const,
      slug: p.slug,
      href: `/dispatches/${p.slug}`,
      title: p.title,
      summary: p.description,
      date: p.date,
    })),
    ...getUpdates({ contentDir, includeDrafts }).map((u) => ({
      kind: 'update' as const,
      slug: u.slug,
      href: `/life/${u.slug}`,
      title: u.title,
      summary: excerpt(u.content),
      date: u.date,
    })),
  ];
  items.sort((a, b) => b.date.getTime() - a.date.getTime());
  return limit === undefined ? items : items.slice(0, limit);
}
