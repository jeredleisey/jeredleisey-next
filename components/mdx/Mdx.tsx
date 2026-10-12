import type { ReactElement } from 'react';
import { evaluate } from 'next-mdx-remote-client/rsc';
import type {
  MDXComponents,
  MDXRemoteOptions,
} from 'next-mdx-remote-client/rsc';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';
import { rehypeCode } from './rehypeCode';

// The one place that renders MDX on the site. A Post, an Update, the About page, and the
// Privacy page all call Mdx and hold no MDX setup of their own.

// The MDX options for all content on the site: Posts, Updates, and the About and
// Privacy pages. GFM adds tables, strikethrough, task lists, and bare links.
const options: MDXRemoteOptions = {
  mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeCode] },
};

// The map of components that MDX uses in place of plain HTML elements. A code fence is a Code Block.
const components: MDXComponents = { pre: CodeBlock };

// Shared editorial prose styling for all long-form reading surfaces
// (essays, lessons, project writeups). Serif body and serif headings (Newsreader),
// constrained reading measure. The single source of truth for
// how prose content reads across the site.
const proseClasses = [
  'prose prose-lg max-w-[68ch] font-serif',
  // Headings use the serif at medium weight, to match the serif titles (#92).
  'prose-headings:font-serif prose-headings:font-medium prose-headings:text-my-espresso dark:prose-headings:text-my-cream',
  // body + lists
  'prose-p:text-my-walnut dark:prose-p:text-my-stone prose-p:leading-[1.7]',
  'prose-li:text-my-walnut dark:prose-li:text-my-stone',
  'prose-strong:text-my-espresso dark:prose-strong:text-my-cream prose-strong:font-semibold',
  'prose-blockquote:text-my-walnut dark:prose-blockquote:text-my-stone prose-blockquote:border-my-stone/40 dark:prose-blockquote:border-my-espresso/40',
  'prose-hr:border-my-stone/30 dark:prose-hr:border-my-espresso/30',
  // tables (GFM). A wide table scrolls sideways in its own box, so it never widens a phone page.
  'prose-table:block prose-table:max-w-full prose-table:overflow-x-auto prose-table:text-[0.9em]',
  'prose-th:text-left prose-th:font-semibold prose-th:text-my-espresso dark:prose-th:text-my-cream prose-th:px-3 prose-th:py-2',
  'prose-td:text-my-walnut dark:prose-td:text-my-stone prose-td:px-3 prose-td:py-2 prose-td:align-top',
  'prose-thead:border-my-stone/60 dark:prose-thead:border-my-stone/40 prose-tr:border-my-stone/30 dark:prose-tr:border-my-stone/20',
  // figures: a screenshot gets a thin frame, so that a dark image has an edge on a dark page
  'prose-img:rounded-md prose-img:border prose-img:border-my-stone/30 dark:prose-img:border-my-espresso/40',
  'prose-figcaption:text-my-walnut/80 dark:prose-figcaption:text-my-stone/80 prose-figcaption:text-[0.85em]',
  // links
  'prose-a:text-my-orange prose-a:no-underline hover:prose-a:text-my-espresso dark:hover:prose-a:text-my-cream',
  // code stays monospace, not serif
  'prose-code:font-mono prose-code:text-my-amber prose-code:bg-my-stone/20 dark:prose-code:bg-my-espresso/50 prose-code:px-1 prose-code:rounded',
].join(' ');

// MDX source in, rendered content out. Tests call this directly, with no browser and no
// Next server. MDX that does not compile throws, the same as the MDXRemote component
// does when it has no onError.
export async function renderMdx(source: string): Promise<ReactElement> {
  const { content, error } = await evaluate({ source, options, components });
  if (error) throw error;
  return <div className={proseClasses}>{content}</div>;
}

// The server component for pages: <Mdx source={...} />.
export async function Mdx({ source }: { source: string }) {
  return renderMdx(source);
}
