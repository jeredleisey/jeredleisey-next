import { describe, it, expect } from 'vitest';
import path from 'path';
import { ContentError, getAllSeries, getPosts, getSeries, getSeriesPart } from '@/lib/content';

const FIXTURES = path.join(__dirname, '../fixtures/series');

// Each folder under invalid-series holds Posts with one Series mistake. The folder
// name is the name of the Post file that the error must name.
function readInvalid(name: string): () => unknown {
  return () => getPosts({ contentDir: path.join(__dirname, '../fixtures/invalid-series', name) });
}

function expectContentError(name: string, problem: RegExp) {
  expect(readInvalid(name)).toThrow(ContentError);
  expect(readInvalid(name)).toThrow(new RegExp(`${name}\\.mdx`));
  expect(readInvalid(name)).toThrow(problem);
}

describe('getSeries', () => {
  it('lists the Posts of a Series in order of position, not date', () => {
    const series = getSeries('claude-basics', { contentDir: FIXTURES });
    expect(series?.slug).toBe('claude-basics');
    expect(series?.posts.map((p) => p.slug)).toEqual([
      'basics-part-one',
      'basics-part-two',
      'basics-part-three',
    ]);
  });

  it('leaves out a Draft Post unless Drafts are asked for', () => {
    expect(getSeries('claude-basics', { contentDir: FIXTURES })?.posts).toHaveLength(3);
    const withDrafts = getSeries('claude-basics', { contentDir: FIXTURES, includeDrafts: true });
    expect(withDrafts?.posts.map((p) => p.slug)).toEqual([
      'basics-part-one',
      'basics-part-two',
      'basics-part-three',
      'basics-part-four-draft',
    ]);
  });

  it('takes the title from the slug when the Series has no series file', () => {
    const series = getSeries('claude-basics', { contentDir: FIXTURES });
    expect(series?.title).toBe('Claude Basics');
    expect(series?.description).toBeUndefined();
  });

  it('takes the title and description from the series file when there is one', () => {
    expect(getSeries('field-notes', { contentDir: FIXTURES })).toMatchObject({
      slug: 'field-notes',
      title: 'Notes from the Field',
      description: 'Short Posts from work at the well site.',
    });
  });

  it('does not read a series file as a Post', () => {
    const slugs = getPosts({ contentDir: FIXTURES, includeDrafts: true }).map((p) => p.slug);
    expect(slugs).not.toContain('field-notes');
  });

  it('returns nothing when no Post names the Series', () => {
    expect(getSeries('no-such-series', { contentDir: FIXTURES })).toBeNull();
  });

  it('returns nothing when only Drafts name the Series, unless Drafts are asked for', () => {
    expect(getSeries('draft-only', { contentDir: FIXTURES })).toBeNull();
    expect(getSeries('draft-only', { contentDir: FIXTURES, includeDrafts: true })?.posts).toHaveLength(1);
  });
});

describe('getAllSeries', () => {
  it('lists every Series that a published Post names, by slug', () => {
    expect(getAllSeries({ contentDir: FIXTURES }).map((s) => s.slug)).toEqual([
      'claude-basics',
      'field-notes',
    ]);
  });

  it('includes a Series of only Drafts when Drafts are asked for', () => {
    const series = getAllSeries({ contentDir: FIXTURES, includeDrafts: true });
    expect(series.map((s) => s.slug)).toEqual(['claude-basics', 'draft-only', 'field-notes']);
    expect(series[0].posts).toHaveLength(4);
  });
});

describe('getSeriesPart', () => {
  it('gives the part number, the number of parts, and the previous and next Posts', () => {
    const part = getSeriesPart('basics-part-two', { contentDir: FIXTURES });
    expect(part).toMatchObject({ part: 2, parts: 3 });
    expect(part?.series).toMatchObject({ slug: 'claude-basics', title: 'Claude Basics' });
    expect(part?.previous?.slug).toBe('basics-part-one');
    expect(part?.next?.slug).toBe('basics-part-three');
  });

  it('gives no previous Post for the first part', () => {
    const part = getSeriesPart('basics-part-one', { contentDir: FIXTURES });
    expect(part).toMatchObject({ part: 1, parts: 3, previous: null });
    expect(part?.next?.slug).toBe('basics-part-two');
  });

  it('gives no next Post for the last published part, while the next part is a hidden Draft', () => {
    const part = getSeriesPart('basics-part-three', { contentDir: FIXTURES });
    expect(part).toMatchObject({ part: 3, parts: 3, next: null });
    expect(part?.previous?.slug).toBe('basics-part-two');
  });

  it('counts and links a Draft part when Drafts are asked for', () => {
    const options = { contentDir: FIXTURES, includeDrafts: true };
    expect(getSeriesPart('basics-part-three', options)).toMatchObject({ part: 3, parts: 4 });
    expect(getSeriesPart('basics-part-three', options)?.next?.slug).toBe('basics-part-four-draft');
    const last = getSeriesPart('basics-part-four-draft', options);
    expect(last).toMatchObject({ part: 4, parts: 4, next: null });
  });

  it('gives a one-Post Series no previous or next Post', () => {
    expect(getSeriesPart('field-notes-one', { contentDir: FIXTURES })).toMatchObject({
      part: 1,
      parts: 1,
      previous: null,
      next: null,
    });
  });

  it('returns nothing for a Post in no Series, a hidden Draft, or no Post', () => {
    expect(getSeriesPart('standalone-post', { contentDir: FIXTURES })).toBeNull();
    expect(getSeriesPart('basics-part-four-draft', { contentDir: FIXTURES })).toBeNull();
    expect(getSeriesPart('no-such-post', { contentDir: FIXTURES })).toBeNull();
  });
});

describe('Series frontmatter checks', () => {
  it('rejects a Post with a series and no seriesPosition', () => {
    expectContentError('missing-position', /"seriesPosition" is required when "series" is set/);
  });

  it('rejects a series file with no title, and names the series file', () => {
    const read = () =>
      getSeries('some-series', {
        contentDir: path.join(__dirname, '../fixtures/invalid-series/series-file-no-title'),
      });
    expect(read).toThrow(ContentError);
    expect(read).toThrow(/series\/some-series\.mdx: "title" is required and must be text/);
  });

  it('rejects a series that is not a slug', () => {
    expectContentError('series-not-slug', /"series" must be a slug of lowercase letters, digits, and hyphens/);
  });

  it('rejects two Posts at the same position in one Series, and names both files', () => {
    const read = () =>
      getSeries('some-series', {
        contentDir: path.join(__dirname, '../fixtures/invalid-series/duplicate-position'),
      });
    expect(read).toThrow(ContentError);
    expect(read).toThrow(/first-at-two\.mdx/);
    expect(read).toThrow(/second-at-two\.mdx/);
    expect(read).toThrow(/seriesPosition 2 in Series "some-series"/);
  });

  it('allows a hidden Draft at the position of a published Post, and rejects it when Drafts are asked for', () => {
    const contentDir = path.join(__dirname, '../fixtures/invalid-series/draft-duplicate');
    expect(getSeries('some-series', { contentDir })?.posts.map((p) => p.slug)).toEqual([
      'published-at-one',
    ]);
    expect(() => getSeries('some-series', { contentDir, includeDrafts: true })).toThrow(
      /draft-at-one\.mdx.*published-at-one\.mdx|published-at-one\.mdx.*draft-at-one\.mdx/,
    );
  });

  it.each(['position-zero', 'position-fraction', 'position-text'])(
    'rejects a seriesPosition that is not a whole number of 1 or more (%s)',
    (name) => {
      expectContentError(name, /"seriesPosition" must be a whole number of 1 or more/);
    },
  );
});
