import { describe, it, expect } from 'vitest';
import path from 'path';
import { getFeed, getPosts, getSeriesParts } from '@/lib/content';

const SAME_DAY = path.join(__dirname, '../fixtures/same-day');

describe('Posts on the same day', () => {
  it('lists the Posts of one Series together, the last part first, and other Posts by slug', () => {
    expect(getPosts({ contentDir: SAME_DAY }).map((p) => p.slug)).toEqual([
      'newest',
      'c-alone',
      'm-alone',
      'b-part-three',
      'a-part-two',
      'z-part-one',
    ]);
  });

  it('keeps that order in the feed', () => {
    const feed = getFeed({ contentDir: SAME_DAY, publicDir: SAME_DAY, projects: [] });
    expect(feed.map((i) => i.slug).slice(3)).toEqual(['b-part-three', 'a-part-two', 'z-part-one']);
  });
});

describe('getSeriesParts', () => {
  it('gives each Post in a Series its Series, its part number, and the number of parts', () => {
    const parts = getSeriesParts({ contentDir: SAME_DAY });
    expect(parts.get('a-part-two')).toMatchObject({ part: 2, parts: 3 });
    expect(parts.get('a-part-two')?.series).toMatchObject({ slug: 'saga', title: 'Saga' });
    expect(parts.get('z-part-one')).toMatchObject({ part: 1, parts: 3 });
  });

  it('has no entry for a Post in no Series', () => {
    expect(getSeriesParts({ contentDir: SAME_DAY }).has('m-alone')).toBe(false);
  });
});

describe('getFeed Series part', () => {
  it('gives a Post in a Series its part number, and a Post in no Series none', () => {
    const feed = getFeed({ contentDir: SAME_DAY, publicDir: SAME_DAY, projects: [] });
    expect(feed.find((i) => i.slug === 'b-part-three')).toMatchObject({ seriesTitle: 'Saga', seriesPart: 3 });
    expect(feed.find((i) => i.slug === 'm-alone')?.seriesPart).toBeUndefined();
  });
});
