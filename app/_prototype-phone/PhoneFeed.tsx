'use client';

// PROTOTYPE (#78). Throwaway. Not for main.
// The feed on a phone (below 768px), on a reading page. Three variants, chosen with the bar at
// the top of the screen. The choice is kept in localStorage, so it survives navigation.
// A: the bottom edge. The feed is a sheet closed to its top edge: a hairline across the screen
//    with the wire circle. The circle opens the sheet to 85% of the screen.
// B: a thin rail on the right, like the desktop panel.
// C: a button in the top bar that drops the feed down from under the bar.
// In A and B the edge hides while you scroll down and comes back when you scroll up.
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { FeedList } from '@/components/home/FeedList';
import type { SplitFeed } from '@/lib/content';

const MOTION = 'cubic-bezier(0.2, 0, 0, 1)';
const KEY = 'proto78-variant';
const VARIANTS = [
  { key: 'A', name: 'Bottom edge' },
  { key: 'B', name: 'Right rail' },
  { key: 'C', name: 'Top bar' },
];

function readVariant() {
  try {
    return localStorage.getItem(KEY) ?? 'A';
  } catch {
    return 'A';
  }
}
function writeVariant(v: string) {
  try {
    localStorage.setItem(KEY, v);
  } catch {}
  window.dispatchEvent(new Event(KEY));
}
function useVariant() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(KEY, cb);
      window.addEventListener('storage', cb);
      return () => {
        window.removeEventListener(KEY, cb);
        window.removeEventListener('storage', cb);
      };
    },
    readVariant,
    () => 'A',
  );
}

const isReadingPage = (p: string) => /^\/(dispatches|life|projects)\/[^/]+$/.test(p);

// Hidden while the reader scrolls down, shown again on any scroll up. The page scrolls
// inside <main>, not the window.
function useHiddenOnScrollDown(pathname: string) {
  const [hiddenOn, setHiddenOn] = useState<string | null>(null);
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    let last = main.scrollTop;
    const onScroll = () => {
      const y = main.scrollTop;
      if (y > last + 6 && y > 40) setHiddenOn(pathname);
      else if (y < last - 6) setHiddenOn(null);
      last = y;
    };
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => main.removeEventListener('scroll', onScroll);
  }, [pathname]);
  return hiddenOn === pathname;
}

function Arrow({ rotate }: { rotate: number }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      style={{ transform: `rotate(${rotate}deg)`, transition: `transform 300ms ${MOTION}` }}
    >
      <polyline points="15 6 9 12 15 18" />
    </svg>
  );
}

const circle =
  'flex items-center justify-center w-9 h-9 rounded-full border border-my-walnut dark:border-my-stone bg-my-cream dark:bg-my-espresso text-my-espresso dark:text-my-cream active:text-my-orange active:border-my-espresso dark:active:border-my-cream transition-colors';

export function PhoneFeed({ feed }: { feed: SplitFeed }) {
  const pathname = usePathname();
  const variant = useVariant();
  const reading = isReadingPage(pathname);
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = reading && openedAt === pathname;
  const hidden = useHiddenOnScrollDown(pathname) && !open;
  const toggle = () => setOpenedAt(open ? null : pathname);

  // Leave room at the edge of the page, so the edge never covers the last words.
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main || !reading) return;
    const narrow = window.matchMedia('(max-width: 767px)').matches;
    if (!narrow) return;
    if (variant === 'A') main.style.paddingBottom = '3rem';
    if (variant === 'B') main.style.paddingRight = '1rem';
    return () => {
      main.style.paddingBottom = '';
      main.style.paddingRight = '';
    };
  }, [reading, variant]);

  // Variant A: drag the sheet's edge up to open it. Drag the sheet down to close it, by
  // its top edge, or anywhere on the feed when the feed is already at its top as the
  // finger lands. A drag that starts on a
  // scrolled feed only scrolls, even when it reaches the top, so one gesture never
  // turns from a scroll into a close.
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  // Down is positive (closing an open sheet), up is negative (opening a closed one).
  const [dragY, setDragY] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const edgeStartT = useRef(0);
  // A drag on the edge must not also count as a tap on the circle.
  const edgeDragged = useRef(false);
  const lift = open ? 0 : Math.max(0, -dragY);

  useEffect(() => {
    const el = feedRef.current;
    if (!el || variant !== 'A' || !open) return;
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
        if (mode === 'drag') setDragging(true);
      }
      if (mode === 'drag') {
        // Stop the page from scrolling or bouncing while the sheet follows the finger.
        e.preventDefault();
        moved = Math.max(0, dy);
        setDragY(moved);
      }
    };
    const onEnd = (e: TouchEvent) => {
      if (mode !== 'drag') return;
      mode = 'scroll';
      // A long drag or a fast flick closes. Anything else springs back.
      const speed = moved / Math.max(1, e.timeStamp - startT);
      setDragging(false);
      setDragY(0);
      if (moved > 100 || (moved > 30 && speed > 0.5)) setOpenedAt(null);
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
  }, [variant, open]);

  return (
    <div className="md:hidden">
      {process.env.NODE_ENV !== 'production' && (
        <div className="fixed bottom-24 right-2 z-[100] flex flex-col gap-1 rounded-full bg-black text-white text-[11px] font-mono shadow-lg ring-1 ring-white/20 p-1">
          {VARIANTS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => writeVariant(v.key)}
              title={v.name}
              className={`w-7 h-7 rounded-full ${variant === v.key ? 'bg-white text-black' : ''}`}
            >
              {v.key}
            </button>
          ))}
        </div>
      )}

      {reading && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setOpenedAt(null)}
            className={`fixed inset-0 ${variant === 'C' ? 'top-14 z-30' : 'z-[45]'} bg-my-espresso/30 dark:bg-black/50 transition-opacity duration-300 ${
              open ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />

          {variant === 'A' && (
            <div
              className="fixed inset-x-0 bottom-0 z-[46] flex flex-col bg-my-cream dark:bg-my-espresso border-t border-my-stone/70 dark:border-my-stone/40 animate-[sheet-edge-in_400ms_150ms_backwards]"
              style={{
                height: '85dvh',
                // Closed, only the top 24px of the sheet shows, above the safe area.
                transform: open
                  ? `translateY(${Math.max(0, dragY)}px)`
                  : hidden
                    ? 'translateY(calc(100% + 2rem))'
                    : `translateY(calc(100% - 24px - env(safe-area-inset-bottom) - ${lift}px))`,
                transition: dragStart === null && !dragging ? `transform 400ms ${MOTION}` : 'none',
              }}
            >
              <div
                className="relative h-12 shrink-0 touch-none"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setDragStart(e.clientY);
                  edgeStartT.current = e.timeStamp;
                  edgeDragged.current = false;
                }}
                onPointerMove={(e) => {
                  if (dragStart === null) return;
                  const dy = e.clientY - dragStart;
                  if (Math.abs(dy) > 6) edgeDragged.current = true;
                  // The sheet follows the finger, but never past fully open or fully closed.
                  const most = window.innerHeight * 0.85;
                  setDragY(open ? Math.max(0, dy) : Math.max(-most, Math.min(0, dy)));
                }}
                onPointerUp={(e) => {
                  if (dragStart === null) return;
                  const moved = Math.abs(dragY);
                  const speed = moved / Math.max(1, e.timeStamp - edgeStartT.current);
                  // A long drag or a fast flick opens or closes. Anything else springs back.
                  if (edgeDragged.current && (moved > 80 || (moved > 30 && speed > 0.5))) {
                    setOpenedAt(open ? null : pathname);
                  }
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
                  <span className={circle}>
                    <Arrow rotate={open ? -90 : 90} />
                  </span>
                </button>
              </div>
              <div
                ref={feedRef}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pl-6 pb-10"
                inert={!open}
                style={{
                  // While the edge is lifted, the feed fades in with it.
                  opacity: open ? 1 : Math.min(1, lift / 250),
                  transition: dragStart !== null ? 'none' : `opacity ${open ? '300ms 150ms' : '150ms'} ${MOTION}`,
                }}
              >
                <FeedList feed={feed} />
              </div>
            </div>
          )}

          {variant === 'B' && (
            <div
              className="fixed inset-y-0 right-0 z-[46] flex bg-my-cream dark:bg-my-espresso border-l border-my-stone/70 dark:border-my-stone/40"
              style={{
                width: '88vw',
                transform: open ? 'translateX(0)' : hidden ? 'translateX(calc(100% + 1.5rem))' : 'translateX(calc(100% - 14px))',
                transition: `transform 400ms ${MOTION}`,
              }}
            >
              <button
                type="button"
                onClick={toggle}
                aria-label={open ? 'Close the feed' : 'Open the feed'}
                aria-expanded={open}
                className="absolute top-1/2 -left-[18px] -translate-y-1/2"
              >
                <span className={circle}>
                  <Arrow rotate={open ? 180 : 0} />
                </span>
              </button>
              <div
                className="flex-1 min-w-0 overflow-y-auto pt-16 pb-10 pl-8 pr-5"
                inert={!open}
                style={{ opacity: open ? 1 : 0, transition: `opacity ${open ? '300ms 150ms' : '150ms'} ${MOTION}` }}
              >
                <FeedList feed={feed} />
              </div>
            </div>
          )}

          {variant === 'C' && (
            <>
              {/* Sits in the top bar, to the left of the menu button. The glyph is the feed's rail. */}
              <button
                type="button"
                onClick={toggle}
                aria-label={open ? 'Close the feed' : 'Open the feed'}
                aria-expanded={open}
                className="fixed top-0 right-12 z-[41] h-14 w-11 flex items-center justify-center text-my-espresso dark:text-my-cream"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <line x1="6" y1="3" x2="6" y2="21" />
                  <circle cx="6" cy="7" r="1.6" fill="currentColor" />
                  <circle cx="6" cy="14" r="1.6" fill="currentColor" />
                  <line x1="11" y1="7" x2="20" y2="7" />
                  <line x1="11" y1="14" x2="18" y2="14" />
                  {open && <line x1="4" y1="20" x2="8" y2="20" className="text-my-orange" stroke="#FF4F00" />}
                </svg>
              </button>
              <div
                className="fixed inset-x-0 top-14 z-[31] bg-my-cream dark:bg-my-espresso border-b border-my-stone/70 dark:border-my-stone/40 overflow-y-auto px-5 pl-6 pt-6 pb-10"
                inert={!open}
                style={{
                  maxHeight: '80dvh',
                  transform: open ? 'translateY(0)' : 'translateY(-110%)',
                  opacity: open ? 1 : 0,
                  transition: `transform 400ms ${MOTION}, opacity 250ms ${MOTION}`,
                }}
              >
                <FeedList feed={feed} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
