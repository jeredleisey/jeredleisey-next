'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

function GoogleLogo() {
  // Google's standard multicolor "G". Its colors stay the same in both themes.
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#EA4335" d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z" />
      <path fill="#4285F4" d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#FBBC05" d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.4-1.57-5.12-3.74L.97 13.04C2.45 15.98 5.48 18 9 18z" />
    </svg>
  );
}

function GitHubLogo() {
  // GitHub's mark in the text color, so it follows the theme.
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

const PROVIDERS = [
  { id: 'google', label: 'Continue with Google', Logo: GoogleLogo },
  { id: 'github', label: 'Continue with GitHub', Logo: GitHubLogo },
] as const;

export function SignInButtons({ returnTo }: { returnTo: string }) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(provider: (typeof PROVIDERS)[number]['id']) {
    setPending(provider);
    setError(null);
    const { error } = await authClient.signIn.social({ provider, callbackURL: returnTo });
    if (error) {
      setError(error.message ?? 'Sign-in failed. Try again.');
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {PROVIDERS.map(({ id, label, Logo }) => (
        <button
          key={id}
          type="button"
          onClick={() => signIn(id)}
          disabled={pending !== null}
          className="flex items-center gap-3 border border-my-stone/40 dark:border-my-stone/20 px-4 py-3 text-left text-sm text-my-espresso dark:text-my-cream hover:border-my-orange hover:text-my-orange disabled:opacity-50 transition-colors"
        >
          <Logo />
          <span>{pending === id ? 'Redirecting…' : label}</span>
        </button>
      ))}
      {error && (
        <p role="alert" className="text-my-orange text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
