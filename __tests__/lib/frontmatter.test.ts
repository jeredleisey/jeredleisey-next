import { describe, it, expect } from 'vitest';
import path from 'path';
import { ContentError, optionalStringList, readMdxFile } from '@/lib/content/frontmatter';

const LISTS = readMdxFile(path.join(__dirname, '../fixtures/frontmatter/lists.mdx'));

describe('optionalStringList', () => {
  it('reads a list of text values', () => {
    expect(optionalStringList(LISTS, 'topics')).toEqual(['automation', 'reports']);
  });

  it('reads a missing list as an empty list', () => {
    expect(optionalStringList(LISTS, 'audience')).toEqual([]);
  });

  it('rejects a value that is not a list, and names the file', () => {
    expect(() => optionalStringList(LISTS, 'single')).toThrow(ContentError);
    expect(() => optionalStringList(LISTS, 'single')).toThrow(
      /lists\.mdx: "single" must be a list of text values/,
    );
  });

  it('rejects a list that holds a value that is not text', () => {
    expect(() => optionalStringList(LISTS, 'mixed')).toThrow(
      /lists\.mdx: "mixed" must be a list of text values/,
    );
  });
});
