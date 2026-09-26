import { createAuthClient } from 'better-auth/react';
import { customSessionClient } from 'better-auth/client/plugins';
import type { Auth } from '@/lib/auth';

// Same origin as the site, so no baseURL is needed.
export const authClient = createAuthClient({
  // Types the session with the isAdmin flag that the server adds.
  plugins: [customSessionClient<Auth>()],
});
