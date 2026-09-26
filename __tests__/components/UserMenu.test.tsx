import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserMenu } from '@/components/UserMenu';

let session: unknown = null;

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: { useSession: () => ({ data: session, isPending: false }), signOut: vi.fn() },
}));

function signedIn(isAdmin: boolean) {
  session = { user: { name: 'Jered', email: 'jered@example.com', isAdmin }, session: {} };
}

describe('UserMenu', () => {
  beforeEach(() => {
    session = null;
  });

  it('shows the Admin a link to the admin panel', () => {
    signedIn(true);
    render(<UserMenu />);
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin');
  });

  it('shows no Admin link to a User who is not the Admin', () => {
    signedIn(false);
    render(<UserMenu />);
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
  });

  it('shows a Visitor a sign-in link and no Admin link', () => {
    render(<UserMenu />);
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
  });
});
