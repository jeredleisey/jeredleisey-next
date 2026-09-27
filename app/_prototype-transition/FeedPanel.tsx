'use client';

// PROTOTYPE (feed panel). Throwaway. Not for main.
// The feed is one panel that lives in the root layout, so it survives navigation.
// - Home page: docked open on the right.
// - A reading page (a Post, an Update, a Project): closed to the right. Only its left edge
//   stays on screen, as a rail with a wire circle. The rail is the panel's own edge.
// - Every other page: no panel.
// On a reading page the circle opens the panel over the article. A click outside, Esc, or a
// click on an item closes it again. All motion is plain CSS transitions.
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FeedEntry, FeedRow } from '@/components/home/FeedEntry';
import type { SplitFeed } from '@/lib/content';
import { formatDate } from '@/lib/format';

const PANEL = 'min(38rem, 46vw)';
const RAIL = '3rem';
// On hover the closed panel comes out this far, so it reads as a panel you can pull.
const PEEK = '14px';
const MOTION = 'cubic-bezier(0.2, 0, 0, 1)';

type Mode = 'docked' | 'rail' | 'hidden';

function modeOf(pathname: string): Mode {
  if (pathname === '/') return 'docked';
  if (/^\/(dispatches|life|projects)\/[^/]+$/.test(pathname)) return 'rail';
  return 'hidden';
}

export function FeedPanel({ feed }: { feed: SplitFeed }) {
  const pathname = usePathname();
  const mode = modeOf(pathname);
  // The panel remembers the route it opened on, so it closes on any route change.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = mode === 'rail' && openedAt === pathname;
  const [peek, setPeek] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenedAt(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const shown = mode === 'docked' || open;
  const offset = shown
    ? '0px'
    : mode === 'rail'
      ? `calc(${PANEL} - ${RAIL}${peek ? ` - ${PEEK}` : ''})`
      : PANEL;
  const transition = `transform 450ms ${MOTION}, border-color 200ms ${MOTION}`;

  return (
    <>
      {/* The scrim over the article while the panel is open on a reading page. */}
      <div
        aria-hidden
        onClick={() => setOpenedAt(null)}
        className={`fixed inset-0 z-30 bg-my-espresso/25 dark:bg-black/40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        aria-label="Latest work and life"
        className="relative z-40 shrink-0 hidden lg:block"
        style={{
          width: mode === 'docked' ? PANEL : mode === 'rail' ? RAIL : '0px',
          transition: `width 450ms ${MOTION}`,
        }}
      >
        <div
          className={`absolute inset-y-0 right-0 flex bg-my-cream dark:bg-my-espresso border-l ${
            mode === 'rail' ? 'border-my-stone/60 dark:border-my-stone/30' : 'border-transparent'
          } ${peek && !open ? '!border-my-walnut dark:!border-my-stone' : ''}`}
          style={{ width: PANEL, transform: `translateX(${offset})`, transition }}
        >
          {/* The rail: the panel's own left edge, with the handle in the middle. */}
          <div className="relative w-12 shrink-0">
            {mode === 'rail' && (
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
                <span
                  className={`flex items-center justify-center w-8 h-8 -ml-12 rounded-full border bg-my-cream dark:bg-my-espresso transition-colors duration-200 ${
                    peek
                      ? 'border-my-espresso dark:border-my-cream text-my-orange'
                      : 'border-my-stone dark:border-my-stone/60 text-my-walnut dark:text-my-stone'
                  } group-focus-visible:ring-2 group-focus-visible:ring-my-orange/60`}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden
                    className="transition-transform duration-200"
                    style={{
                      transform: `${open ? 'rotate(180deg)' : ''} translateX(${peek ? '-2px' : '0'})`,
                      transitionTimingFunction: MOTION,
                    }}
                  >
                    <polyline points="15 6 9 12 15 18" />
                  </svg>
                </span>
              </button>
            )}
          </div>

          {/* The feed. While the panel is closed, it is transparent, so a peek shows only the
              panel's edge, and nothing in it takes focus. The left padding keeps the dots and
              the year ticks, which sit across the feed's line, inside the scroll area. */}
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

function FeedList({ feed: { full, years } }: { feed: SplitFeed }) {
  if (full.length === 0) {
    return <p className="text-my-walnut dark:text-my-stone text-sm font-light">Nothing here yet.</p>;
  }
  return (
    <div className="border-l border-my-stone/50 dark:border-my-stone/25 pb-12">
      <ol>
        {full.map((item) => (
          <li key={`${item.kind}-${item.slug}`} className="relative pl-8 pb-12 last:pb-10">
            <span
              aria-hidden
              className="absolute -left-[3px] top-1.5 w-[5px] h-[5px] rounded-full bg-my-walnut dark:bg-my-stone"
            />
            <time
              dateTime={item.date.toISOString().slice(0, 10)}
              className="block text-xs tabular-nums text-my-walnut dark:text-my-stone mb-2"
            >
              {formatDate(item.date)}
            </time>
            <FeedEntry item={item} />
          </li>
        ))}
      </ol>
      {years.map(({ year, items }) => (
        <section key={year} className="relative pl-8 pb-10 last:pb-0">
          <span aria-hidden className="absolute -left-[6px] top-[0.45rem] w-[11px] h-px bg-my-walnut dark:bg-my-stone" />
          <h2 className="text-xs tracking-widest tabular-nums text-my-walnut dark:text-my-stone mb-1">{year}</h2>
          <ul>
            {items.map((item) => (
              <li key={`${item.kind}-${item.slug}`}>
                <FeedRow item={item} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
