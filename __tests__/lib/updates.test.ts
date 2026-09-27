import { describe, it, expect } from 'vitest';
import path from 'path';
import { ContentError, getUpdate, getUpdates } from '@/lib/content';

const FIXTURES = path.join(__dirname, '../fixtures/content');
// The photo of an Update is a file next to it in the fixture folder.
const FIXTURE_DIRS = { contentDir: FIXTURES, publicDir: FIXTURES };

// Each folder under invalid-updates holds one Update with one frontmatter mistake.
// The Update file has the same name as its folder. The folder is also the public
// folder, so a photo is a file next to the Update.
function readInvalid(name: string): () => unknown {
  const dir = path.join(__dirname, '../fixtures/invalid-updates', name);
  return () => getUpdates({ contentDir: dir, publicDir: dir });
}

function expectContentError(name: string, problem: RegExp) {
  expect(readInvalid(name)).toThrow(ContentError);
  expect(readInvalid(name)).toThrow(new RegExp(`${name}\\.mdx`));
  expect(readInvalid(name)).toThrow(problem);
}

describe('getUpdates', () => {
  it('lists published Updates, newest first', () => {
    const updates = getUpdates(FIXTURE_DIRS);
    expect(updates.map((u) => u.slug)).toEqual(['full-update', 'plain-update']);
    expect(updates[1].date.toISOString()).toBe('2026-02-14T00:00:00.000Z');
    expect(updates[1].content.trim()).toBe('A plain Update with no title, photos, or link.');
  });

  it('includes Draft Updates in date order when Drafts are asked for', () => {
    const updates = getUpdates({ ...FIXTURE_DIRS, includeDrafts: true });
    expect(updates.map((u) => u.slug)).toEqual(['draft-update', 'full-update', 'plain-update']);
    expect(updates[0].draft).toBe(true);
  });
});

describe('getUpdate', () => {
  it('returns one published Update with its text', () => {
    const update = getUpdate('plain-update', FIXTURE_DIRS);
    expect(update).toMatchObject({ slug: 'plain-update', draft: false });
    expect(update?.content.trim()).toBe('A plain Update with no title, photos, or link.');
  });

  it('gives the title, photos, and link of an Update that has them', () => {
    expect(getUpdate('full-update', FIXTURE_DIRS)).toMatchObject({
      title: 'A Full Update',
      photos: [{ src: '/life/full-update.png', alt: 'A small orange square', width: 8, height: 6 }],
      link: { url: 'https://example.com/trail', label: 'The trail' },
    });
  });

  it('gives no title, no photos, and no link to an Update that has none', () => {
    const update = getUpdate('plain-update', FIXTURE_DIRS);
    expect(update?.title).toBeUndefined();
    expect(update?.photos).toEqual([]);
    expect(update?.link).toBeUndefined();
  });

  it('returns nothing for a slug that has no Update', () => {
    expect(getUpdate('no-such-update', FIXTURE_DIRS)).toBeNull();
  });

  it('hides a Draft Update unless Drafts are asked for', () => {
    expect(getUpdate('draft-update', FIXTURE_DIRS)).toBeNull();
    expect(getUpdate('draft-update', { ...FIXTURE_DIRS, includeDrafts: true })).toMatchObject({
      slug: 'draft-update',
      draft: true,
    });
  });
});

describe('Update frontmatter checks', () => {
  it('rejects an Update without a date', () => {
    expectContentError('missing-date', /"date" is required and must be a date in the form YYYY-MM-DD/);
  });

  it('rejects a photo without alt text', () => {
    expectContentError('photo-missing-alt', /photo 1 needs "alt" text/);
  });

  it('rejects a photo whose alt text is blank', () => {
    expectContentError('photo-blank-alt', /photo 1 needs "alt" text/);
  });

  it('rejects a photo that is not a file under /life/', () => {
    expectContentError('photo-outside-life', /photo 1 "src" must be a path under \/life\//);
    expectContentError('photo-leaves-life', /photo 1 "src" must be a path under \/life\//);
  });

  it('rejects a photo without its width and height in pixels', () => {
    expectContentError('photo-missing-size', /photo 1 "height" must be a whole number of pixels/);
  });

  it('rejects photos that are not a list', () => {
    expectContentError('photos-not-list', /"photos" must be a list of photos/);
  });

  it('rejects a link without an http or https URL', () => {
    expectContentError('link-missing-url', /"link" needs a "url" that starts with http:\/\/ or https:\/\//);
    expectContentError('link-not-web', /"link" needs a "url" that starts with http:\/\/ or https:\/\//);
  });

  it('rejects a link label that is blank', () => {
    expectContentError('link-blank-label', /"link" "label" must be text/);
  });

  it('rejects a photo that has no file in the public folder', () => {
    expectContentError(
      'photo-file-missing',
      /photo 1 "src" \/life\/no-such-photo\.jpg has no file at __tests__\/fixtures\/invalid-updates\/photo-file-missing\/life\/no-such-photo\.jpg/,
    );
  });

  // The file is hike.png. A Mac finds it as Hike.png, but the live site does not.
  it('rejects a photo whose letter case is not the same as its file', () => {
    expectContentError('photo-file-case', /photo 1 "src" \/life\/Hike\.png has no file at /);
  });
});
