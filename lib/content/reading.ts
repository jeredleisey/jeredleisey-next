// A reader's pace, in words a minute.
const WORDS_PER_MINUTE = 230;

// The minutes it takes to read an MDX body, rounded, and never less than 1. Code blocks,
// tags, and Markdown marks do not count as words.
export function readingMinutes(mdx: string): number {
  const words = mdx
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`~[\]()!]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
