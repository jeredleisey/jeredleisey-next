import { describe, it, expect } from 'vitest';
import { readingMinutes } from '@/lib/content';

const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');

describe('readingMinutes', () => {
  it('reads 230 words a minute, rounded', () => {
    expect(readingMinutes(words(460))).toBe(2);
    expect(readingMinutes(words(800))).toBe(3);
  });

  it('is at least 1 minute', () => {
    expect(readingMinutes('A short Update.')).toBe(1);
  });

  it('does not count code blocks', () => {
    const code = ['```python', words(500), '```'].join('\n');
    expect(readingMinutes(`${words(460)}\n\n${code}`)).toBe(2);
  });
});
