'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export function UserMenu() {
  const { data: session, isPending } = authClient.useSession();
  const pathname = usePathname();
  const router = useRouter();

  if (isPending) return null;

  if (!session) {
    return (
      <Link
        href={`/sign-in?next=${encodeURIComponent(pathname)}`}
        className="text-xs text-my-walnut hover:text-my-espresso dark:text-my-stone dark:hover:text-my-cream transition-colors"
      >
        Sign in
      </Link>
    );
  }

  async function signOut() {
    await authClient.signOut();
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-my-espresso dark:text-my-cream truncate" title={session.user.email}>
        {session.user.name || session.user.email}
      </span>
      <button
        type="button"
        onClick={signOut}
        className="self-start text-xs text-my-walnut hover:text-my-espresso dark:text-my-stone dark:hover:text-my-cream transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
