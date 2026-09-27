'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FeedList } from './home/FeedList';
import { FEED_MOTION as MOTION, feedMode } from './feedMode';
import type { SplitFeed } from '@/lib/content';

const PANEL = 'min(38rem, 46vw)';
const RAIL = '3rem';
// On hover the closed panel comes out this far, so it reads as a panel to pull open.
const PEEK = '14px';
// The feed as one panel in the root layout, 768px and wider, so it survives
// navigation. When it closes, it slides to the right until only its left edge is on
// screen: the rail is the panel's own edge.
export function FeedPanel({ feed }: { feed: SplitFeed }) {
  const pathname = usePathname();
  const mode = feedMode(pathname);
  const [peek, setPeek] = useState(false);
  // The panel remembers the route it opened on, so it closes on any route change.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = mode === 'closed' && openedAt === pathname;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenedAt(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const shown = mode === 'open' || open;
  const offset = shown ? '0px' : mode === 'closed' ? `calc(${PANEL} - ${RAIL}${peek ? ` - ${PEEK}` : ''})` : PANEL;

  return (
    <>
      {/* The scrim over the page while the panel is open on a reading page. */}
      <div
        aria-hidden="true"
        data-testid="feed-scrim"
        data-feed-panel
        onClick={() => setOpenedAt(null)}
        className={`fixed inset-0 z-30 hidden md:block bg-my-espresso/25 dark:bg-black/40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* On a page with no panel, it stays in the page so it can slide away, but it is
          hidden from assistive technology and takes no focus. */}
      <aside
        aria-label="Latest work and life"
        aria-hidden={mode === 'none' || undefined}
        inert={mode === 'none'}
        data-feed-panel
        className="relative z-40 shrink-0 hidden md:block"
        style={{
          width: mode === 'open' ? PANEL : mode === 'closed' ? RAIL : '0px',
          transition: `width 450ms ${MOTION}`,
        }}
      >
        <div
          className={`absolute inset-y-0 right-0 flex bg-my-cream dark:bg-my-espresso border-l ${
            mode !== 'closed'
              ? 'border-transparent'
              : peek && !open
                ? 'border-my-walnut dark:border-my-stone'
                : 'border-my-stone/60 dark:border-my-stone/30'
          }`}
          style={{
            width: PANEL,
            transform: `translateX(${offset})`,
            transition: `transform 450ms ${MOTION}, border-color 200ms ${MOTION}`,
          }}
        >
          <div className="relative w-12 shrink-0">
            {mode === 'closed' && (
              <button
                type="button"
                onClick={() => setOpenedAt(open ? null : pathname)}
                onMouseEnter={() => setPeek(true)}
                onMouseLeave={() => setPeek(false)}
                onFocus={() => setPeek(true)}
                onBlur={() => setPeek(false)}
                aria-label={open ? 'Close the feed' : 'Open the feed'}
                aria-expanded={open}
                className="group absolute inset-0 flex items-center justify-center cursor-pointer focus-visible:outline-none"
              >
                {/* The wire circle sits on the panel's edge. The negative margin centers it on the line. */}
                <span
                  className={`flex items-center justify-center w-8 h-8 -ml-12 rounded-full border bg-my-cream dark:bg-my-espresso transition-colors duration-200 group-focus-visible:ring-2 group-focus-visible:ring-my-orange/60 ${
                    peek
                      ? 'border-my-espresso dark:border-my-cream text-my-orange'
                      : 'border-my-stone dark:border-my-stone/60 text-my-walnut dark:text-my-stone'
                  }`}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                    style={{
                      // Open, the arrow points right, the way the panel closes.
                      transform: `${open ? 'rotate(180deg) ' : ''}translateX(${peek ? '-2px' : '0'})`,
                      transition: `transform 200ms ${MOTION}`,
                    }}
                  >
                    <polyline points="15 6 9 12 15 18" />
                  </svg>
                </span>
              </button>
            )}
          </div>

          {/* While the panel is closed, the feed is transparent, so a peek shows only the
              panel's edge, and nothing in it takes focus. The left padding keeps the dots
              and year ticks, which sit across the feed's line, inside the scroll area. */}
          <div
            className="flex-1 min-w-0 overflow-y-auto py-pad-4 pl-2 pr-pad-2"
            inert={!shown}
            style={{ opacity: shown ? 1 : 0, transition: `opacity ${shown ? '300ms 150ms' : '200ms'} ${MOTION}` }}
          >
            <FeedList feed={feed} />
          </div>
        </div>
      </aside>
    </>
  );
}
