import { createAuthClient } from 'better-auth/react';

// Same origin as the site, so no baseURL is needed.
export const authClient = createAuthClient();
