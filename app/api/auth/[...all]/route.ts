import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '@/lib/auth';

// Resolve the auth instance per request, so the build needs no secrets.
function handler(request: Request) {
  return getAuth().handler(request);
}

export const { GET, POST } = toNextJsHandler(handler);
