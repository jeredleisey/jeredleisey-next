// Shapes of the OpenRouter Decisions API. These are type-only imports, so
// nothing from the SDK reaches the browser bundle.
import type {
  DecisionsRequest,
  DecisionsResponse,
} from '@openrouter/sdk/models';

export type { DecisionsRequest, DecisionsResponse };

export type RunErrorKind =
  | 'unauthenticated'
  | 'no-access'
  | 'invalid-input'
  | 'limit-reached'
  | 'upstream';

export interface RunError {
  kind: RunErrorKind;
  message: string;
}

export type RunResult =
  | { ok: true; response: DecisionsResponse }
  | { ok: false; error: RunError };
