import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FeedPanel } from '@/components/FeedPanel';
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

function panel() {
  return screen.queryByRole('complementary', { name: /latest work and life/i });
}

describe('FeedPanel', () => {
  beforeEach(() => {
    pathname = '/';
  });

  it('is docked open on the home page, with its feed and no circle', () => {
    render(<FeedPanel feed={feed} />);
    expect(panel()).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /a post/i }).closest('[inert]')).toBeNull();
    expect(screen.queryByRole('button', { name: /feed/i })).toBeNull();
  });

  it.each(['/dispatches/a-post', '/life/an-update', '/projects/jev'])(
    'is closed to a rail on the reading page %s, and its feed takes no focus',
    (path) => {
      pathname = path;
      render(<FeedPanel feed={feed} />);
      expect(screen.getByRole('button', { name: /open the feed/i })).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByRole('link', { name: /a post/i }).closest('[inert]')).not.toBeNull();
    },
  );

  it('opens over a reading page with the circle, and closes with it again', () => {
    pathname = '/dispatches/a-post';
    render(<FeedPanel feed={feed} />);
    fireEvent.click(screen.getByRole('button', { name: /open the feed/i }));
    expect(screen.getByRole('button', { name: /close the feed/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: /a post/i }).closest('[inert]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /close the feed/i }));
    expect(screen.getByRole('button', { name: /open the feed/i })).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes with the Esc key', () => {
    pathname = '/dispatches/a-post';
    render(<FeedPanel feed={feed} />);
    fireEvent.click(screen.getByRole('button', { name: /open the feed/i }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByRole('button', { name: /open the feed/i })).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes with a click on the scrim over the page', () => {
    pathname = '/dispatches/a-post';
    render(<FeedPanel feed={feed} />);
    fireEvent.click(screen.getByRole('button', { name: /open the feed/i }));
    fireEvent.click(screen.getByTestId('feed-scrim'));
    expect(screen.getByRole('button', { name: /open the feed/i })).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes when the route changes', () => {
    pathname = '/dispatches/a-post';
    const { rerender } = render(<FeedPanel feed={feed} />);
    fireEvent.click(screen.getByRole('button', { name: /open the feed/i }));
    pathname = '/life/an-update';
    rerender(<FeedPanel feed={feed} />);
    expect(screen.getByRole('button', { name: /open the feed/i })).toHaveAttribute('aria-expanded', 'false');
  });

  function expectOpen() {
    expect(screen.getByRole('button', { name: /close the feed/i })).toHaveAttribute('aria-expanded', 'true');
  }
  function expectClosed() {
    expect(screen.getByRole('button', { name: /open the feed/i })).toHaveAttribute('aria-expanded', 'false');
  }

  // A finger drag on the circle, which sits on the rail: the panel's left edge.
  function dragRail(from: number, to: number) {
    const circle = screen.getByRole('button', { name: /the feed/i });
    fireEvent.pointerDown(circle, { clientX: from, pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerMove(circle, { clientX: to, pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerUp(circle, { clientX: to, pointerId: 1, pointerType: 'touch' });
  }

  it('opens with a long drag left on the rail, and springs back from a short one', () => {
    pathname = '/dispatches/a-post';
    render(<FeedPanel feed={feed} />);
    dragRail(1000, 980);
    expectClosed();
    dragRail(1000, 700);
    expectOpen();
  });

  it('closes with a long drag right on the open panel edge, and springs back from a short one', () => {
    pathname = '/dispatches/a-post';
    render(<FeedPanel feed={feed} />);
    fireEvent.click(screen.getByRole('button', { name: /open the feed/i }));
    dragRail(500, 520);
    expectOpen();
    dragRail(500, 800);
    expectClosed();
  });

  it('does not count a drag on the rail as a tap on the circle, but a tap still toggles', () => {
    pathname = '/dispatches/a-post';
    render(<FeedPanel feed={feed} />);
    dragRail(1000, 700);
    // The browser can fire a click at the end of the drag.
    fireEvent.click(screen.getByRole('button', { name: /close the feed/i }));
    expectOpen();
    // A tap moves the finger by a pixel or two.
    dragRail(500, 502);
    fireEvent.click(screen.getByRole('button', { name: /close the feed/i }));
    expectClosed();
  });

  // A finger drag on the feed. It returns false when the panel claims the gesture, so
  // the browser does not also scroll.
  function dragFeed(dx: number, dy: number) {
    const link = screen.getByRole('link', { name: /a post/i });
    fireEvent.touchStart(link, { touches: [{ clientX: 500, clientY: 300 }] });
    const step = fireEvent.touchMove(link, { touches: [{ clientX: 500 + dx / 10, clientY: 300 + dy / 10 }] });
    const rest = fireEvent.touchMove(link, { touches: [{ clientX: 500 + dx, clientY: 300 + dy }] });
    fireEvent.touchEnd(link, { touches: [] });
    return step && rest;
  }

  it('closes with a drag right anywhere on the feed, but only scrolls on a vertical drag', () => {
    pathname = '/dispatches/a-post';
    render(<FeedPanel feed={feed} />);
    fireEvent.click(screen.getByRole('button', { name: /open the feed/i }));
    expect(dragFeed(20, 300)).toBe(true);
    expectOpen();
    expect(dragFeed(300, 20)).toBe(false);
    expectClosed();
  });

  it('has no drag on the home page, where it is docked open', () => {
    render(<FeedPanel feed={feed} />);
    expect(dragFeed(300, 20)).toBe(true);
    expect(screen.getByRole('link', { name: /a post/i }).closest('[inert]')).toBeNull();
  });

  it('does not drag with a mouse, so a desktop keeps the click on the circle', () => {
    pathname = '/dispatches/a-post';
    render(<FeedPanel feed={feed} />);
    const circle = screen.getByRole('button', { name: /open the feed/i });
    fireEvent.pointerDown(circle, { clientX: 1000, pointerId: 1, pointerType: 'mouse' });
    fireEvent.pointerMove(circle, { clientX: 700, pointerId: 1, pointerType: 'mouse' });
    fireEvent.pointerUp(circle, { clientX: 700, pointerId: 1, pointerType: 'mouse' });
    expectClosed();
    fireEvent.click(circle);
    expectOpen();
  });

  it.each(['/dispatches', '/dispatches/series/basics', '/life', '/projects', '/about', '/admin/users'])(
    'is not there on %s',
    (path) => {
      pathname = path;
      render(<FeedPanel feed={feed} />);
      expect(panel()).toBeNull();
      expect(screen.queryByRole('link', { name: /a post/i })).toBeNull();
    },
  );
});
