import { PROJECTS, type Project } from '@/lib/projects';
import { getPosts, type PostOptions } from './posts';
import { getAllSeries } from './series';
import { getUpdates, type Photo } from './updates';

export type FeedKind = 'project' | 'post' | 'update';

export interface FeedItem {
  kind: FeedKind;
  slug: string;
  href: string;
  // An Update may have no title.
  title?: string;
  summary: string;
  date: Date;
  // The title of a Post's Series. Other kinds have none.
  seriesTitle?: string;
  // The first photo of an Update. Other kinds have none.
  photo?: Photo;
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
  const seriesTitles = new Map(getAllSeries({ contentDir, includeDrafts }).map((s) => [s.slug, s.title]));
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
      ...(p.series && { seriesTitle: seriesTitles.get(p.series) }),
    })),
    ...getUpdates({ contentDir, includeDrafts }).map((u) => ({
      kind: 'update' as const,
      slug: u.slug,
      href: `/life/${u.slug}`,
      title: u.title,
      summary: excerpt(u.content),
      date: u.date,
      ...(u.photos[0] && { photo: u.photos[0] }),
    })),
  ];
  items.sort((a, b) => b.date.getTime() - a.date.getTime());
  return limit === undefined ? items : items.slice(0, limit);
}

// The home page shows the newest items as full entries and every older item as a
// one-line row under its year.
export const FULL_ENTRIES = 5;

export interface FeedYear {
  year: number;
  items: FeedItem[];
}

export interface SplitFeed {
  full: FeedItem[];
  // Newest year first. The items keep the feed's order.
  years: FeedYear[];
}

// Splits a feed that is newest first. Dates are UTC days, so the year is the UTC year.
export function splitFeed(feed: FeedItem[], fullEntries = FULL_ENTRIES): SplitFeed {
  const years: FeedYear[] = [];
  for (const item of feed.slice(fullEntries)) {
    const year = item.date.getUTCFullYear();
    const last = years.at(-1);
    if (last?.year === year) last.items.push(item);
    else years.push({ year, items: [item] });
  }
  return { full: feed.slice(0, fullEntries), years };
}
