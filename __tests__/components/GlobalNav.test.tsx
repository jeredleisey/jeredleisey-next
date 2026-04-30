import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlobalNav } from '@/components/GlobalNav';

vi.mock('next/navigation', () => ({
  usePathname: () => '/learn',
}));

describe('GlobalNav', () => {
  it('renders the site name', () => {
    render(<GlobalNav />);
    expect(screen.getByText('Jered Leisey')).toBeInTheDocument();
  });

  it('renders all four nav links', () => {
    render(<GlobalNav />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Learn' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Writing' })).toBeInTheDocument();
  });

  it('highlights the active section in orange', () => {
    render(<GlobalNav />);
    const learnLink = screen.getByRole('link', { name: 'Learn' });
    expect(learnLink).toHaveClass('text-my-orange');
    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).not.toHaveClass('text-my-orange');
  });
});
