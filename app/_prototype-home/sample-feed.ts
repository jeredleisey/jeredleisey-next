// PROTOTYPE (#57). Throwaway. Not for main.
//
// The real feed has only one Project and one Draft Post today, which is too little to judge a
// layout. These sample items fill the feed out to a realistic mix. The page merges them with the
// real feed, and each sample item is marked, so nobody mistakes it for real content.
import type { FeedItem } from '@/lib/content';

export interface ProtoItem extends FeedItem {
  sample?: boolean;
  // Only Updates have photos. A sample photo is a colored block, not a file.
  photo?: { tone: string; ratio: string; alt: string };
  series?: string;
}

const d = (s: string) => new Date(`${s}T00:00:00Z`);

export const SAMPLE_ITEMS: ProtoItem[] = [
  {
    kind: 'update',
    slug: 'sample-first-snow',
    href: '#',
    summary: 'First snow on the Flatirons this morning. Rode anyway. Yellow Jacket did not mind.',
    date: d('2026-09-25'),
    photo: { tone: '#7A6E64', ratio: '4 / 3', alt: 'Sample photo' },
    sample: true,
  },
  {
    kind: 'post',
    slug: 'sample-rpa-to-agents',
    href: '#',
    title: 'From RPA bots to agents: what changed and what did not',
    summary: 'Ten years of automating back-office work, and why the hard part is still the process map.',
    date: d('2026-09-20'),
    series: 'Automation notes',
    sample: true,
  },
  {
    kind: 'update',
    slug: 'sample-record',
    href: '#',
    title: 'On the turntable',
    summary: 'Ryoji Ikeda, The Solar System. Nearly all black. I framed the sleeve and play the record.',
    date: d('2026-09-14'),
    sample: true,
  },
  {
    kind: 'post',
    slug: 'sample-power-automate',
    href: '#',
    title: 'Power Automate flows that survive a reorg',
    summary: 'Connections owned by service accounts, environment variables, and one rule about owners.',
    date: d('2026-08-30'),
    series: 'Automation notes',
    sample: true,
  },
  {
    kind: 'project',
    slug: 'sample-well-lookup',
    href: '#',
    title: 'Well lookup',
    summary: 'Search wells by name or API number and see the production history on one page.',
    date: d('2026-08-12'),
    sample: true,
  },
  {
    kind: 'update',
    slug: 'sample-bonsai',
    href: '#',
    summary: 'Repotted the juniper. Three years in the same pot was one too many.',
    date: d('2026-07-28'),
    photo: { tone: '#4F6B4A', ratio: '3 / 4', alt: 'Sample photo' },
    sample: true,
  },
  {
    kind: 'post',
    slug: 'sample-physics',
    href: '#',
    title: 'What a physics degree taught me about debugging',
    summary: 'Change one variable. Write down what you expect before you look.',
    date: d('2025-12-03'),
    sample: true,
  },
  {
    kind: 'update',
    slug: 'sample-amp',
    href: '#',
    title: 'The Fender is back',
    summary: 'New tubes, same tweed. It sounds like 1962 again.',
    date: d('2025-08-17'),
    sample: true,
  },
  {
    kind: 'post',
    slug: 'sample-sharepoint',
    href: '#',
    title: 'SharePoint lists are a database until they are not',
    summary: 'Where the 5,000 item view limit bites, and what to move to first.',
    date: d('2025-03-09'),
    sample: true,
  },
  {
    kind: 'project',
    slug: 'sample-old-site',
    href: '#',
    title: 'The first jeredleisey.com',
    summary: 'The site before this one.',
    date: d('2024-11-02'),
    sample: true,
  },
];

export function withSamples(real: FeedItem[]): ProtoItem[] {
  return [...real, ...SAMPLE_ITEMS].sort((a, b) => b.date.getTime() - a.date.getTime());
}

export const KIND_LABEL = { project: 'Project', post: 'Dispatch', update: 'Life' } as const;

// A placeholder of realistic length. Jered writes the real sentence.
export const SENTENCE = 'I build software and automation for an energy company, and I write down what I learn.';
