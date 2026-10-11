// Shared editorial prose styling for all long-form reading surfaces
// (essays, lessons, project writeups). Serif body and serif headings (Newsreader),
// constrained reading measure. The single source of truth for
// how prose content reads across the site.
export const proseClasses = [
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
  // links
  'prose-a:text-my-orange prose-a:no-underline hover:prose-a:text-my-espresso dark:hover:prose-a:text-my-cream',
  // code stays monospace, not serif
  'prose-code:font-mono prose-code:text-my-amber prose-code:bg-my-stone/20 dark:prose-code:bg-my-espresso/50 prose-code:px-1 prose-code:rounded',
  'prose-pre:font-mono prose-pre:bg-my-stone/20 dark:prose-pre:bg-my-espresso/50 prose-pre:border prose-pre:border-my-stone/30 dark:prose-pre:border-my-espresso/30',
].join(' ');
