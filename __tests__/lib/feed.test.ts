import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { getFeed, splitFeed, type FeedItem } from '@/lib/content';
import type { Project } from '@/lib/projects';

const contentDir = path.join(__dirname, '../fixtures/content');
// The photo of an Update is a file next to it in the fixture folder.
const publicDir = contentDir;

const projects: Project[] = [
  {
    slug: 'demo',
    title: 'Demo Project',
    description: 'A Project for the feed tests.',
    protected: true,
    defaultRoleName: 'Demo testers',
    date: '2026-03-01',
  },
];

describe('getFeed', () => {
  it('merges Projects, Posts, and Updates, newest first, and tags each with its kind', () => {
    const feed = getFeed({ contentDir, publicDir, projects });
    expect(feed.map((item) => [item.kind, item.slug])).toEqual([
      ['update', 'full-update'],
      ['post', 'newer-post'],
      ['project', 'demo'],
      ['update', 'plain-update'],
      ['post', 'middle-post'],
      ['post', 'older-post'],
    ]);
  });

  it('links each item to its own page', () => {
    const feed = getFeed({ contentDir, publicDir, projects });
    const hrefs = Object.fromEntries(feed.map((item) => [item.slug, item.href]));
    expect(hrefs['demo']).toBe('/projects/demo');
    expect(hrefs['newer-post']).toBe('/dispatches/newer-post');
    expect(hrefs['full-update']).toBe('/life/full-update');
  });

  it('leaves out Drafts unless Drafts are asked for', () => {
    expect(getFeed({ contentDir, publicDir, projects }).map((i) => i.slug)).not.toContain('draft-post');
    const withDrafts = getFeed({ contentDir, publicDir, projects, includeDrafts: true }).map((i) => i.slug);
    expect(withDrafts.slice(0, 3)).toEqual(['draft-update', 'full-update', 'draft-post']);
  });

  it('returns at most the given number of items', () => {
    const feed = getFeed({ contentDir, publicDir, projects, limit: 2 });
    expect(feed.map((i) => i.slug)).toEqual(['full-update', 'newer-post']);
  });

  it('summarizes an Update by its text, and keeps its title when it has one', () => {
    const feed = getFeed({ contentDir, publicDir, projects });
    const plain = feed.find((i) => i.slug === 'plain-update');
    expect(plain?.title).toBeUndefined();
    expect(plain?.summary).toBe('A plain Update with no title, photos, or link.');
    expect(feed.find((i) => i.slug === 'full-update')?.title).toBe('A Full Update');
  });

  it('gives an Update its first photo, and an Update with no photo none', () => {
    const feed = getFeed({ contentDir, publicDir, projects });
    expect(feed.find((i) => i.slug === 'full-update')?.photo).toEqual({
      src: '/life/full-update.png',
      alt: 'A small orange square',
      width: 8,
      height: 6,
    });
    expect(feed.find((i) => i.slug === 'plain-update')?.photo).toBeUndefined();
  });

  it('gives a Post in a Series the title of its Series, and a Post in no Series none', () => {
    const feed = getFeed({ contentDir, publicDir, projects });
    // some-series has no series file, so its title comes from its slug.
    expect(feed.find((i) => i.slug === 'middle-post')?.seriesTitle).toBe('Some Series');
    expect(feed.find((i) => i.slug === 'newer-post')?.seriesTitle).toBeUndefined();
  });
});

// A Post on the given day. splitFeed reads only the order and the date.
const item = (slug: string, day: string): FeedItem => ({
  kind: 'post',
  slug,
  href: `/dispatches/${slug}`,
  title: slug,
  summary: '',
  date: new Date(`${day}T00:00:00Z`),
});

describe('splitFeed', () => {
  it('keeps the 5 newest items as full entries and groups the older ones by year, newest year first', () => {
    const feed = [
      item('a', '2026-09-01'),
      item('b', '2026-08-01'),
      item('c', '2026-07-01'),
      item('d', '2026-06-01'),
      item('e', '2026-05-01'),
      item('f', '2026-04-01'),
      item('g', '2025-12-01'),
      item('h', '2025-02-01'),
      item('i', '2023-06-01'),
    ];
    const { full, years } = splitFeed(feed);
    expect(full.map((i) => i.slug)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(years.map((y) => [y.year, y.items.map((i) => i.slug)])).toEqual([
      [2026, ['f']],
      [2025, ['g', 'h']],
      [2023, ['i']],
    ]);
  });

  it('has no years when the feed has 5 items or fewer', () => {
    const feed = [item('a', '2026-09-01'), item('b', '2025-08-01'), item('c', '2024-07-01')];
    expect(splitFeed(feed)).toEqual({ full: feed, years: [] });
  });
});
