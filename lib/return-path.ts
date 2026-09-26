const BASE = 'http://return-path.invalid';

// Where to send a User after sign-in. Only a path on this site is allowed,
// so a crafted ?next= cannot send anyone to another site (open redirect).
// The URL parser decides, because it reads tricks like "/\evil" the same
// way a browser does.
export function safeReturnPath(next: string | undefined): string {
  if (!next || !next.startsWith('/')) return '/';
  const url = new URL(next, BASE);
  if (url.origin !== BASE) return '/';
  return url.pathname + url.search + url.hash;
}
