import 'server-only';
import { OpenRouter } from '@openrouter/sdk';
import type { DecisionsClient } from './run';

// The real OpenRouter client for the Jev Run module. Call it at request
// time, never at import time, so the build needs no secrets. It throws
// before any call when the key is missing, so no Run is logged for that.
export function createOpenRouterClient(): DecisionsClient {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is not set. Add the OpenRouter key to .env.local.'
    );
  }
  const sdk = new OpenRouter({ apiKey });
  return {
    decide(request) {
      return sdk.alpha.decisions.create({ decisionsRequest: request });
    },
  };
}
