import { SignInButtons } from '@/components/SignInButtons';
import { safeReturnPath } from '@/lib/return-path';

export const metadata = { title: 'Sign in — Jered Leisey' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const returnTo = safeReturnPath(Array.isArray(next) ? next[0] : next);

  return (
    <div className="p-pad-2 max-w-sm">
      <h1 className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-pad-2">
        Sign in
      </h1>
      <p className="text-my-espresso dark:text-my-cream text-sm font-light leading-relaxed mb-pad-2">
        Sign in to use the Projects on this site. A new account starts without access. You can
        ask for access on each Project&apos;s page.
      </p>
      <SignInButtons returnTo={returnTo} />
    </div>
  );
}
