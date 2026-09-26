import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';

let pathname = '/';
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: { useSession: () => ({ data: null, isPending: false }), signOut: vi.fn() },
}));

function renderSidebar() {
  return render(
    <ThemeProvider>
      <Sidebar allSeries={[]} allProjects={[]} allEssays={[]} allDialogues={[]} />
    </ThemeProvider>,
  );
}

function menuButton() {
  return screen.getByRole('button', { name: /open navigation menu/i });
}

describe('Sidebar mobile drawer', () => {
  beforeEach(() => {
    pathname = '/';
  });

  it('starts closed', () => {
    renderSidebar();
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens and closes with the menu and close buttons', () => {
    renderSidebar();
    fireEvent.click(menuButton());
    expect(menuButton()).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: /close navigation menu/i }));
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes when the route changes', () => {
    const { rerender } = renderSidebar();
    fireEvent.click(menuButton());
    expect(menuButton()).toHaveAttribute('aria-expanded', 'true');

    pathname = '/projects';
    rerender(
      <ThemeProvider>
        <Sidebar allSeries={[]} allProjects={[]} allEssays={[]} allDialogues={[]} />
      </ThemeProvider>,
    );
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
  });
});
