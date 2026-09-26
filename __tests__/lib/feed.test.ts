import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { getFeed } from '@/lib/content';
import type { Project } from '@/lib/projects';

const contentDir = path.join(__dirname, '../fixtures/content');

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
    const feed = getFeed({ contentDir, projects });
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
    const feed = getFeed({ contentDir, projects });
    const hrefs = Object.fromEntries(feed.map((item) => [item.slug, item.href]));
    expect(hrefs['demo']).toBe('/projects/demo');
    expect(hrefs['newer-post']).toBe('/dispatches/newer-post');
    expect(hrefs['full-update']).toBe('/life/full-update');
  });

  it('leaves out Drafts unless Drafts are asked for', () => {
    expect(getFeed({ contentDir, projects }).map((i) => i.slug)).not.toContain('draft-post');
    const withDrafts = getFeed({ contentDir, projects, includeDrafts: true }).map((i) => i.slug);
    expect(withDrafts.slice(0, 3)).toEqual(['draft-update', 'full-update', 'draft-post']);
  });

  it('returns at most the given number of items', () => {
    const feed = getFeed({ contentDir, projects, limit: 2 });
    expect(feed.map((i) => i.slug)).toEqual(['full-update', 'newer-post']);
  });

  it('summarizes an Update by its text, and keeps its title when it has one', () => {
    const feed = getFeed({ contentDir, projects });
    const plain = feed.find((i) => i.slug === 'plain-update');
    expect(plain?.title).toBeUndefined();
    expect(plain?.summary).toBe('A plain Update with no title, photos, or link.');
    expect(feed.find((i) => i.slug === 'full-update')?.title).toBe('A Full Update');
  });
});

