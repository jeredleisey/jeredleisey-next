import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { GlobalNav } from '@/components/GlobalNav';
import { ThemeProvider } from '@/components/ThemeProvider';

vi.mock('next/navigation', () => ({
  usePathname: () => '/projects/jev',
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: { useSession: () => ({ data: null, isPending: false }), signOut: vi.fn() },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('GlobalNav', () => {
  it('links the site name to the home page', () => {
    render(<GlobalNav />, { wrapper });
    expect(screen.getByRole('link', { name: 'Jered Leisey' })).toHaveAttribute('href', '/');
  });

  it('shows Projects and none of the removed sections', () => {
    render(<GlobalNav />, { wrapper });
    const nav = screen.getByRole('navigation', { name: 'Site navigation' });
    expect(within(nav).getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
    for (const removed of ['Home', 'Learn', 'Writing', 'Dialogues']) {
      expect(within(nav).queryByRole('link', { name: removed })).not.toBeInTheDocument();
    }
  });

  it('highlights the section of the current page', () => {
    render(<GlobalNav />, { wrapper });
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('aria-current', 'page');
  });

  it('renders the theme toggle button', () => {
    render(<GlobalNav />, { wrapper });
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
