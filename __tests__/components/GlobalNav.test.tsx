import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlobalNav } from '@/components/GlobalNav';
import { ThemeProvider } from '@/components/ThemeProvider';

vi.mock('next/navigation', () => ({
  usePathname: () => '/learn',
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('GlobalNav', () => {
  it('renders the site name', () => {
    render(<GlobalNav />, { wrapper });
    expect(screen.getByText('Jered Leisey')).toBeInTheDocument();
  });

  it('renders all four nav links', () => {
    render(<GlobalNav />, { wrapper });
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Learn' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Writing' })).toBeInTheDocument();
  });

  it('highlights the active section in orange', () => {
    render(<GlobalNav />, { wrapper });
    const learnLink = screen.getByRole('link', { name: 'Learn' });
    expect(learnLink).toHaveClass('text-my-orange');
    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).not.toHaveClass('text-my-orange');
  });

  it('renders the theme toggle button', () => {
    render(<GlobalNav />, { wrapper });
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
