'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

const PROVIDERS = [
  { id: 'google', label: 'Continue with Google' },
  { id: 'github', label: 'Continue with GitHub' },
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
      {PROVIDERS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => signIn(id)}
          disabled={pending !== null}
          className="border border-my-stone/40 dark:border-my-stone/20 px-4 py-3 text-left text-sm text-my-espresso dark:text-my-cream hover:border-my-orange hover:text-my-orange disabled:opacity-50 transition-colors"
        >
          {pending === id ? 'Redirecting…' : label}
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
