'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FeedList } from './home/FeedList';
import { FEED_MOTION as MOTION, feedMode, isDecisive } from './feedMode';
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
  const toggle = () => setOpenedAt(open ? null : pathname);

  // A finger drag in progress on a reading page. Right is positive (closing the open
  // panel), left is negative (opening the closed one). The panel follows the finger
  // with no transition. A mouse does not drag: on a desktop, the circle is a button.
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const railStartT = useRef(0);
  // A drag on the rail must not also count as a tap on the circle.
  const railDragged = useRef(false);
  const [feedDragging, setFeedDragging] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const pull = open ? 0 : Math.max(0, -dragX);
  const dragging = dragStart !== null || feedDragging;

  // A drag right anywhere on the open feed closes the panel. The first 6px of a gesture
  // decide what it is: a horizontal move to the right is a drag, and anything else is a
  // scroll for the whole gesture. React attaches touch listeners as passive, and this
  // one must be able to stop the browser from scrolling, so it is a native listener.
  useEffect(() => {
    const el = feedRef.current;
    if (!el || !open) return;
    let startX = 0;
    let startY = 0;
    let startT = 0;
    let moved = 0;
    let mode: 'undecided' | 'drag' | 'scroll' = 'scroll';
    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startT = e.timeStamp;
      moved = 0;
      mode = 'undecided';
    };
    const onMove = (e: TouchEvent) => {
      if (mode === 'scroll') return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (mode === 'undecided') {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return;
        mode = dx > Math.abs(dy) ? 'drag' : 'scroll';
        if (mode === 'drag') setFeedDragging(true);
      }
      if (mode === 'drag') {
        e.preventDefault();
        moved = Math.max(0, dx);
        setDragX(moved);
      }
    };
    const onEnd = (e: TouchEvent) => {
      if (mode !== 'drag') return;
      mode = 'scroll';
      setFeedDragging(false);
      setDragX(0);
      if (isDecisive(moved, e.timeStamp - startT)) setOpenedAt(null);
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenedAt(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const shown = mode === 'open' || open;
  // The panel follows the finger, but never past fully open or fully closed.
  const offset = open
    ? `min(${Math.max(0, dragX)}px, ${PANEL} - ${RAIL})`
    : shown
      ? '0px'
      : mode !== 'closed'
        ? PANEL
        : pull > 0
          ? `max(0px, ${PANEL} - ${RAIL} - ${pull}px)`
          : `calc(${PANEL} - ${RAIL}${peek ? ` - ${PEEK}` : ''})`;

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
            transition: dragging
              ? `border-color 200ms ${MOTION}`
              : `transform 450ms ${MOTION}, border-color 200ms ${MOTION}`,
          }}
        >
          {/* The rail. The circle sits on it, and a finger drag anywhere on it moves the panel. */}
          <div
            className={`relative w-12 shrink-0 ${mode === 'closed' ? 'touch-none' : ''}`}
            onPointerDown={(e) => {
              if (mode !== 'closed' || e.pointerType === 'mouse') return;
              e.currentTarget.setPointerCapture?.(e.pointerId);
              setDragStart(e.clientX);
              railStartT.current = e.timeStamp;
              railDragged.current = false;
            }}
            onPointerMove={(e) => {
              if (dragStart === null) return;
              const dx = e.clientX - dragStart;
              if (Math.abs(dx) > 6) railDragged.current = true;
              setDragX(open ? Math.max(0, dx) : Math.min(0, dx));
            }}
            onPointerUp={(e) => {
              if (dragStart === null) return;
              const dx = e.clientX - dragStart;
              const moved = open ? dx : -dx;
              if (railDragged.current && isDecisive(moved, e.timeStamp - railStartT.current)) toggle();
              setDragStart(null);
              setDragX(0);
            }}
            onPointerCancel={() => {
              setDragStart(null);
              setDragX(0);
            }}
          >
            {mode === 'closed' && (
              <button
                type="button"
                onClick={() => {
                  if (!railDragged.current) toggle();
                  railDragged.current = false;
                }}
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
            ref={feedRef}
            className={`flex-1 min-w-0 overflow-y-auto py-pad-4 pl-2 pr-pad-2 ${open ? 'touch-pan-y touch-pinch-zoom' : ''}`}
            inert={!shown}
            style={{
              // While the rail is pulled, the feed fades in with it.
              opacity: shown ? 1 : Math.min(1, pull / 250),
              transition: dragging ? 'none' : `opacity ${shown ? '300ms 150ms' : '200ms'} ${MOTION}`,
            }}
          >
            <FeedList feed={feed} />
          </div>
        </div>
      </aside>
    </>
  );
}
