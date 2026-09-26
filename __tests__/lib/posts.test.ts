import { describe, it, expect } from 'vitest';
import path from 'path';
import { ContentError, getPost, getPosts } from '@/lib/content';

const FIXTURES = path.join(__dirname, '../fixtures/content');

// Each folder under invalid-posts holds one Post with one frontmatter mistake.
// The Post file has the same name as its folder.
function readInvalid(name: string): () => unknown {
  return () => getPosts({ contentDir: path.join(__dirname, '../fixtures/invalid-posts', name) });
}

function expectContentError(name: string, problem: RegExp) {
  expect(readInvalid(name)).toThrow(ContentError);
  expect(readInvalid(name)).toThrow(new RegExp(`${name}\\.mdx`));
  expect(readInvalid(name)).toThrow(problem);
}

describe('getPosts', () => {
  it('lists published Posts, newest first', () => {
    const posts = getPosts({ contentDir: FIXTURES });
    expect(posts.map((p) => p.slug)).toEqual(['newer-post', 'middle-post', 'older-post']);
    expect(posts[0]).toMatchObject({
      slug: 'newer-post',
      title: 'Newer Post',
      description: 'The newer published Post.',
    });
    expect(posts[0].date.toISOString().slice(0, 10)).toBe('2026-03-05');
  });

  it('includes Draft Posts in date order when Drafts are asked for', () => {
    const posts = getPosts({ contentDir: FIXTURES, includeDrafts: true });
    expect(posts.map((p) => p.slug)).toEqual(['draft-post', 'newer-post', 'middle-post', 'older-post']);
    expect(posts[0].draft).toBe(true);
    expect(posts[1].draft).toBe(false);
  });
});

describe('getPost', () => {
  it('returns one published Post with its MDX body', () => {
    const post = getPost('older-post', { contentDir: FIXTURES });
    expect(post).toMatchObject({ slug: 'older-post', title: 'Older Post', draft: false });
    expect(post?.content.trim()).toBe('The older body.');
  });

  it('reads a date that is written without quotes', () => {
    expect(getPost('older-post', { contentDir: FIXTURES })?.date.toISOString()).toBe(
      '2026-01-10T00:00:00.000Z',
    );
  });

  it('accepts series and facet fields, which later slices read', () => {
    expect(getPost('middle-post', { contentDir: FIXTURES })).toMatchObject({ title: 'Middle Post' });
  });

  it('returns nothing for a slug that has no Post', () => {
    expect(getPost('no-such-post', { contentDir: FIXTURES })).toBeNull();
  });

  it('hides a Draft Post unless Drafts are asked for', () => {
    expect(getPost('draft-post', { contentDir: FIXTURES })).toBeNull();
    expect(getPost('draft-post', { contentDir: FIXTURES, includeDrafts: true })).toMatchObject({
      slug: 'draft-post',
      draft: true,
    });
  });

  it('gives the Project that a Post names, and nothing when it names none', () => {
    expect(getPost('newer-post', { contentDir: FIXTURES })?.project).toMatchObject({
      slug: 'jev',
      title: 'Jev prompt tester',
    });
    expect(getPost('older-post', { contentDir: FIXTURES })?.project).toBeUndefined();
  });
});

describe('frontmatter checks', () => {
  it('rejects a Post whose project is not in the Project registry', () => {
    expectContentError('unknown-project', /project "no-such-project" is not in the Project registry/);
  });

  it('rejects a Post with no title', () => {
    expectContentError('missing-title', /"title" is required and must be text/);
  });

  it('rejects a Post with no description', () => {
    expectContentError('missing-description', /"description" is required and must be text/);
  });

  it('rejects a Post with no date', () => {
    expectContentError('missing-date', /"date" is required and must be a date in the form YYYY-MM-DD/);
  });

  it('rejects a Post whose date does not exist', () => {
    expectContentError('bad-date', /"date" is required and must be a date in the form YYYY-MM-DD/);
  });

  it('rejects a Post whose date is not in the form YYYY-MM-DD', () => {
    expectContentError('non-iso-date', /"date" is required and must be a date in the form YYYY-MM-DD/);
  });

  it('rejects a Post whose draft is not true or false', () => {
    expectContentError('draft-not-boolean', /"draft" must be true or false/);
  });

  it('rejects a Post whose project is not text', () => {
    expectContentError('project-not-text', /"project" must be text/);
  });
});
