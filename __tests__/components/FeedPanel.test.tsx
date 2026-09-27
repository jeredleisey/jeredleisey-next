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
