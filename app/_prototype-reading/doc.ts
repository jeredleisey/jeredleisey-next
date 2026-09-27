// PROTOTYPE (reading pages). Throwaway. Not for main.
// One description of a reading page, for a Post or an Update, so the variants differ only
// in structure.
import type { ReactNode } from 'react';

export interface ReadingDoc {
  kind: 'post' | 'update';
  kindLabel: string;
  title?: string;
  description?: string;
  date: Date;
  draft: boolean;
  minutes: number;
  words: number;
  series?: {
    slug: string;
    title: string;
    part: number;
    parts: number;
    posts: { slug: string; title: string; current: boolean }[];
    previous?: { slug: string; title: string };
    next?: { slug: string; title: string };
  };
  project?: { slug: string; title: string };
  facets: { label: string; param: string; values: string[] }[];
  body: ReactNode;
}

export function wordCount(mdx: string): number {
  return mdx
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`~\[\]()!-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

export const VARIANTS = [
  { key: '0', name: 'Current' },
  { key: 'A', name: 'Column' },
  { key: 'B', name: 'Margin rail' },
  { key: 'C', name: 'Spread' },
];
