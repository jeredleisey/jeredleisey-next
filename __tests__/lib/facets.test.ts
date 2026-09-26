import { describe, it, expect } from 'vitest';
import path from 'path';
import { ContentError, getFacets, getPost, getPosts, type PostFilters, type PostOptions } from '@/lib/content';

const FACETS = path.join(__dirname, '../fixtures/facets');

function slugs(options: PostOptions & PostFilters): string[] {
  return getPosts({ contentDir: FACETS, ...options }).map((p) => p.slug);
}

describe('Post facets', () => {
  it('reads the topics, audience, and use cases of a Post', () => {
    expect(getPost('two-topics', { contentDir: FACETS })).toMatchObject({
      topics: ['automation', 'reports'],
      audience: ['engineers'],
      useCases: ['monthly-close'],
    });
  });

  it('reads missing facet fields as empty lists', () => {
    expect(getPost('no-facets', { contentDir: FACETS })).toMatchObject({
      topics: [],
      audience: [],
      useCases: [],
    });
  });
});

describe('getPosts filters', () => {
  it('filters by topic, including Posts with several topics', () => {
    expect(slugs({ topic: 'automation' })).toEqual(['two-topics', 'two-audiences']);
    expect(slugs({ topic: 'reports' })).toEqual(['two-topics']);
  });

  it('filters by audience, including Posts with several audiences', () => {
    expect(slugs({ audience: 'engineers' })).toEqual(['two-topics', 'two-audiences']);
    expect(slugs({ audience: 'managers' })).toEqual(['two-audiences']);
  });

  it('filters by use case', () => {
    expect(slugs({ useCase: 'monthly-close' })).toEqual(['two-topics']);
  });

  it('combines filters, so a Post must match each one', () => {
    expect(slugs({ topic: 'automation', audience: 'managers' })).toEqual(['two-audiences']);
    expect(slugs({ topic: 'reports', audience: 'managers' })).toEqual([]);
  });

  it('matches nothing for a value that no Post uses', () => {
    expect(slugs({ topic: 'no-such-topic' })).toEqual([]);
  });

  it('filters Drafts only when Drafts are asked for', () => {
    expect(slugs({ topic: 'unreleased' })).toEqual([]);
    expect(slugs({ topic: 'unreleased', includeDrafts: true })).toEqual(['draft-facets']);
  });
});

describe('getFacets', () => {
  it('lists each value in use once, sorted, from published Posts', () => {
    expect(getFacets({ contentDir: FACETS })).toEqual({
      topics: ['automation', 'reports'],
      audiences: ['engineers', 'managers'],
      useCases: ['monthly-close'],
    });
  });

  it('adds values that only Drafts use when Drafts are asked for', () => {
    expect(getFacets({ contentDir: FACETS, includeDrafts: true })).toEqual({
      topics: ['automation', 'reports', 'unreleased'],
      audiences: ['engineers', 'insiders', 'managers'],
      useCases: ['monthly-close', 'planning'],
    });
  });
});

describe('facet frontmatter checks', () => {
  it('rejects a Post whose use cases are not a list, and names the file', () => {
    const read = () =>
      getPosts({ contentDir: path.join(__dirname, '../fixtures/invalid-posts/use-cases-not-list') });
    expect(read).toThrow(ContentError);
    expect(read).toThrow(/use-cases-not-list\.mdx: "useCases" must be a list of text values/);
  });
});
