import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

// A fast gate only: it checks that a session cookie exists and sends a
// Visitor to sign-in. It loads no database code. Pages and route handlers
// do the real session, Permission, and Admin checks on the server.
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const signIn = new URL('/sign-in', request.url);
  signIn.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(signIn);
}

export const config = {
  // Protected Projects and the admin panel. Public pages never pass through here.
  matcher: ['/projects/jev/:path*', '/admin/:path*'],
};
