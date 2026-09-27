import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FeedSheet } from '@/components/FeedSheet';
import type { FeedItem, SplitFeed } from '@/lib/content';

let pathname = '/';
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}));

const post: FeedItem = {
  kind: 'post',
  slug: 'a-post',
  href: '/dispatches/a-post',
  title: 'A Post',
  summary: 'The summary of a Post.',
  date: new Date('2026-09-20T00:00:00Z'),
};
const feed: SplitFeed = { full: [post], years: [] };

function sheet() {
  return screen.queryByRole('complementary', { name: /latest work and life/i });
}

describe('FeedSheet', () => {
  beforeEach(() => {
    pathname = '/dispatches/a-post';
  });

  it.each(['/dispatches/a-post', '/life/an-update', '/projects/jev'])(
    'is closed to the bottom edge on the reading page %s, and its feed takes no focus',
    (path) => {
      pathname = path;
      render(<FeedSheet feed={feed} />);
      expect(sheet()).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /open the feed/i })).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByRole('link', { name: /a post/i }).closest('[inert]')).not.toBeNull();
    },
  );

  it.each(['/', '/dispatches', '/life', '/about'])('is not there on %s', (path) => {
    pathname = path;
    render(<FeedSheet feed={feed} />);
    expect(sheet()).toBeNull();
    expect(screen.queryByRole('link', { name: /a post/i })).toBeNull();
  });

  it('opens with a tap on the circle, and closes with a second tap', () => {
    render(<FeedSheet feed={feed} />);
    fireEvent.click(screen.getByRole('button', { name: /open the feed/i }));
    expect(screen.getByRole('button', { name: /close the feed/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: /a post/i }).closest('[inert]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /close the feed/i }));
    expect(screen.getByRole('button', { name: /open the feed/i })).toHaveAttribute('aria-expanded', 'false');
  });

  function openSheet() {
    fireEvent.click(screen.getByRole('button', { name: /open the feed/i }));
  }
  function expectClosed() {
    expect(screen.getByRole('button', { name: /open the feed/i })).toHaveAttribute('aria-expanded', 'false');
  }

  it('closes with a tap on the scrim over the page', () => {
    render(<FeedSheet feed={feed} />);
    openSheet();
    fireEvent.click(screen.getByTestId('feed-sheet-scrim'));
    expectClosed();
  });

  it('closes with the Esc key', () => {
    render(<FeedSheet feed={feed} />);
    openSheet();
    fireEvent.keyDown(window, { key: 'Escape' });
    expectClosed();
  });

  it('closes when the route changes', () => {
    const { rerender } = render(<FeedSheet feed={feed} />);
    openSheet();
    pathname = '/life/an-update';
    rerender(<FeedSheet feed={feed} />);
    expectClosed();
  });

  // A drag on the circle, which sits on the sheet's top edge.
  function dragEdge(from: number, to: number) {
    const circle = screen.getByRole('button', { name: /the feed/i });
    fireEvent.pointerDown(circle, { clientY: from, pointerId: 1 });
    fireEvent.pointerMove(circle, { clientY: to, pointerId: 1 });
    fireEvent.pointerUp(circle, { clientY: to, pointerId: 1 });
  }

  it('opens with a long drag up on its edge, and springs back from a short one', () => {
    render(<FeedSheet feed={feed} />);
    dragEdge(700, 680);
    expectClosed();
    dragEdge(700, 400);
    expect(screen.getByRole('button', { name: /close the feed/i })).toHaveAttribute('aria-expanded', 'true');
  });

  // A finger drag on the feed. jsdom does not scroll, so the test sets where the feed is.
  function dragFeed(scrollTop: number, from: number, to: number) {
    Object.defineProperty(screen.getByTestId('feed-sheet-feed'), 'scrollTop', { value: scrollTop, configurable: true });
    const link = screen.getByRole('link', { name: /a post/i });
    fireEvent.touchStart(link, { touches: [{ clientY: from }] });
    fireEvent.touchMove(link, { touches: [{ clientY: from + 10 }] });
    fireEvent.touchMove(link, { touches: [{ clientY: to }] });
    fireEvent.touchEnd(link, { touches: [] });
  }

  it('closes with a drag down on a feed at its top, but only scrolls when the drag starts on a scrolled feed', () => {
    render(<FeedSheet feed={feed} />);
    openSheet();
    dragFeed(200, 300, 600);
    expect(screen.getByRole('button', { name: /close the feed/i })).toHaveAttribute('aria-expanded', 'true');
    dragFeed(0, 300, 600);
    expectClosed();
  });

  it('hides its edge while the page scrolls down, and shows it again on a scroll up', () => {
    // The page scrolls inside <main>, as in the root layout.
    const main = document.body.appendChild(document.createElement('main'));
    const scrollMainTo = (y: number) => {
      Object.defineProperty(main, 'scrollTop', { value: y, configurable: true });
      fireEvent.scroll(main);
    };
    render(<FeedSheet feed={feed} />);
    const circle = () => screen.getByRole('button', { name: /open the feed/i, hidden: true });

    scrollMainTo(300);
    expect(circle().closest('[inert]')).not.toBeNull();
    scrollMainTo(200);
    expect(circle().closest('[inert]')).toBeNull();
    main.remove();
  });
});
