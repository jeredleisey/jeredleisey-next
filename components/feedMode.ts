// Where the feed is on a page. It is open on the home page, closed to an edge on the page
// of one Post, Update, or Project, and not there on any other page. The feed panel (768px
// and wider) and the feed sheet (narrower) both follow this.
export type FeedMode = 'open' | 'closed' | 'none';

export const FEED_MOTION = 'cubic-bezier(0.2, 0, 0, 1)';

// A drag longer than this, or a flick, opens or closes the sheet or the panel. Anything
// else springs back.
const DRAG_PX = 80;
const FLICK_PX = 30;
const FLICK_SPEED = 0.5; // pixels per millisecond

export function isDecisive(moved: number, ms: number) {
  return moved > DRAG_PX || (moved > FLICK_PX && moved / Math.max(1, ms) > FLICK_SPEED);
}

export function feedMode(pathname: string): FeedMode {
  if (pathname === '/') return 'open';
  if (/^\/(dispatches|life|projects)\/[^/]+$/.test(pathname)) return 'closed';
  return 'none';
}
