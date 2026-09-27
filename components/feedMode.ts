// Where the feed is on a page. It is open on the home page, closed to an edge on the page
// of one Post, Update, or Project, and not there on any other page. The feed panel (768px
// and wider) and the feed sheet (narrower) both follow this.
export type FeedMode = 'open' | 'closed' | 'none';

export const FEED_MOTION = 'cubic-bezier(0.2, 0, 0, 1)';

export function feedMode(pathname: string): FeedMode {
  if (pathname === '/') return 'open';
  if (/^\/(dispatches|life|projects)\/[^/]+$/.test(pathname)) return 'closed';
  return 'none';
}
