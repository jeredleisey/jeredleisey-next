import { describe, it, expect } from 'vitest';
import { safeReturnPath } from '@/lib/return-path';

describe('safeReturnPath', () => {
  it('keeps a path on this site, with its query', () => {
    expect(safeReturnPath('/projects/jev?tab=run')).toBe('/projects/jev?tab=run');
  });

  it('goes to the home page when no path is given', () => {
    expect(safeReturnPath(undefined)).toBe('/');
    expect(safeReturnPath('')).toBe('/');
  });

  it.each([
    ['a full URL to another site', 'https://evil.example/phish'],
    ['a protocol-relative URL', '//evil.example'],
    ['a backslash that browsers read as a slash', '/\\evil.example'],
    ['a javascript: URL', 'javascript:alert(1)'],
    ['a path without a leading slash', 'evil.example'],
  ])('refuses %s and goes home', (_, next) => {
    expect(safeReturnPath(next)).toBe('/');
  });
});
