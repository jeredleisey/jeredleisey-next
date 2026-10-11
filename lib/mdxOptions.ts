import type { MDXRemoteOptions } from 'next-mdx-remote-client/rsc';
import remarkGfm from 'remark-gfm';

// The MDX options for all content on the site: Posts, Updates, and the About and
// Privacy pages. GFM adds tables, strikethrough, task lists, and bare links.
export const mdxOptions: MDXRemoteOptions = {
  mdxOptions: { remarkPlugins: [remarkGfm] },
};
