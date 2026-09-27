'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FEED_MOTION as MOTION, feedMode } from './feedMode';
import { FeedList } from './home/FeedList';
import type { SplitFeed } from '@/lib/content';

// How much of the closed sheet shows above the bottom of the screen.
const EDGE = '24px';
// The open sheet covers this much of the screen.
const HEIGHT = 0.85;
// A drag longer than this, or a flick, opens or closes the sheet. Anything else springs back.
const DRAG_PX = 80;
const FLICK_PX = 30;
const FLICK_SPEED = 0.5; // pixels per millisecond

// True while the reader scrolls the page down, false again on any scroll up. The page
// scrolls inside <main>, not the window. A new route starts shown.
function useScrollingDown(pathname: string) {
  const [downOn, setDownOn] = useState<string | null>(null);
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    let last = main.scrollTop;
    const onScroll = () => {
      const y = main.scrollTop;
      if (y > last + 6 && y > 40) setDownOn(pathname);
      else if (y < last - 6) setDownOn(null);
      last = y;
    };
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => main.removeEventListener('scroll', onScroll);
  }, [pathname]);
  return downOn === pathname;
}

function isDecisive(moved: number, ms: number) {
  return moved > DRAG_PX || (moved > FLICK_PX && moved / Math.max(1, ms) > FLICK_SPEED);
}

// The feed on a phone (narrower than 768px), on the page of one Post, Update, or
// Project. It is a sheet closed to the bottom edge of the screen: only its top edge
// shows, as a hairline with the wire circle. The feed panel does the same job from
// 768px. The design comes from #78.
export function FeedSheet({ feed }: { feed: SplitFeed }) {
  const pathname = usePathname();
  // The sheet remembers the route it opened on, so it closes on any route change.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const reading = feedMode(pathname) === 'closed';
  const open = reading && openedAt === pathname;
  const toggle = () => setOpenedAt(open ? null : pathname);
  // The closed edge gets out of the way while the reader scrolls down.
  const hidden = useScrollingDown(pathname) && !open;

  // A drag in progress. Down is positive (closing the open sheet), up is negative
  // (opening the closed one). The sheet follows the finger with no transition.
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const edgeStartT = useRef(0);
  // A drag on the edge must not also count as a tap on the circle.
  const edgeDragged = useRef(false);
  const [feedDragging, setFeedDragging] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const lift = open ? 0 : Math.max(0, -dragY);
  const dragging = dragStart !== null || feedDragging;

  // A drag down anywhere on the open feed closes the sheet, but only when the feed is
  // already at its top as the finger lands. A drag that starts on a scrolled feed only
  // scrolls, even when it reaches the top, so one gesture never turns from a scroll
  // into a close. React attaches touch listeners as passive, and this one must be able
  // to stop the page from scrolling, so it is a native listener.
  useEffect(() => {
    const el = feedRef.current;
    if (!el || !open) return;
    let startY = 0;
    let startT = 0;
    let moved = 0;
    let mode: 'undecided' | 'drag' | 'scroll' = 'scroll';
    const onStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      startT = e.timeStamp;
      moved = 0;
      mode = el.scrollTop <= 0 ? 'undecided' : 'scroll';
    };
    const onMove = (e: TouchEvent) => {
      if (mode === 'scroll') return;
      const dy = e.touches[0].clientY - startY;
      if (mode === 'undecided') {
        if (Math.abs(dy) < 6) return;
        mode = dy > 0 ? 'drag' : 'scroll';
        if (mode === 'drag') setFeedDragging(true);
      }
      if (mode === 'drag') {
        e.preventDefault();
        moved = Math.max(0, dy);
        setDragY(moved);
      }
    };
    const onEnd = (e: TouchEvent) => {
      if (mode !== 'drag') return;
      mode = 'scroll';
      setFeedDragging(false);
      setDragY(0);
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

  if (!reading) return null;

  return (
    <>
      {/* The scrim over the page while the sheet is open. */}
      <div
        aria-hidden="true"
        data-testid="feed-sheet-scrim"
        data-feed-panel
        onClick={() => setOpenedAt(null)}
        className={`md:hidden fixed inset-0 z-[45] bg-my-espresso/30 dark:bg-black/50 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        aria-label="Latest work and life"
        data-feed-sheet
        data-feed-panel
        inert={hidden}
        className="md:hidden fixed inset-x-0 bottom-0 z-[46] flex flex-col animate-[feed-edge-in_400ms_150ms_backwards] bg-my-cream dark:bg-my-espresso border-t border-my-stone/70 dark:border-my-stone/40"
        style={{
          height: `${HEIGHT * 100}dvh`,
          transform: open
            ? `translateY(${Math.max(0, dragY)}px)`
            : hidden
              ? 'translateY(calc(100% + 2rem))'
              : `translateY(calc(100% - ${EDGE} - env(safe-area-inset-bottom) - ${lift}px))`,
          transition: dragging ? 'none' : `transform 400ms ${MOTION}`,
        }}
      >
        {/* The edge. The circle sits on it, and a drag anywhere on it moves the sheet. */}
        <div
          className="relative h-12 shrink-0 touch-none"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture?.(e.pointerId);
            setDragStart(e.clientY);
            edgeStartT.current = e.timeStamp;
            edgeDragged.current = false;
          }}
          onPointerMove={(e) => {
            if (dragStart === null) return;
            const dy = e.clientY - dragStart;
            if (Math.abs(dy) > 6) edgeDragged.current = true;
            // The sheet follows the finger, but never past fully open or fully closed.
            const most = window.innerHeight * HEIGHT;
            setDragY(open ? Math.max(0, dy) : Math.max(-most, Math.min(0, dy)));
          }}
          onPointerUp={(e) => {
            if (dragStart === null) return;
            if (edgeDragged.current && isDecisive(Math.abs(dragY), e.timeStamp - edgeStartT.current)) toggle();
            setDragStart(null);
            setDragY(0);
          }}
          onPointerCancel={() => {
            setDragStart(null);
            setDragY(0);
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (!edgeDragged.current) toggle();
              edgeDragged.current = false;
            }}
            aria-label={open ? 'Close the feed' : 'Open the feed'}
            aria-expanded={open}
            className="absolute left-1/2 -top-[18px] -translate-x-1/2"
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-full border border-my-walnut dark:border-my-stone bg-my-cream dark:bg-my-espresso text-my-espresso dark:text-my-cream">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={{ transform: `rotate(${open ? -90 : 90}deg)`, transition: `transform 300ms ${MOTION}` }}>
                <polyline points="15 6 9 12 15 18" />
              </svg>
            </span>
          </button>
        </div>
        <div
          ref={feedRef}
          data-testid="feed-sheet-feed"
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pl-6 pb-10"
          inert={!open}
          style={{
            // While the edge is lifted, the feed fades in with it.
            opacity: open ? 1 : Math.min(1, lift / 250),
            transition: dragging ? 'none' : `opacity ${open ? '300ms 150ms' : '150ms'} ${MOTION}`,
          }}
        >
          <FeedList feed={feed} />
        </div>
      </aside>
    </>
  );
}
