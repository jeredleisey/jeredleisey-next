import type { AccessUser, SiteDb, createAccess } from '@/lib/access';
import { run as runTable } from '@/lib/db/schema';
import type { DecisionsRequest, DecisionsResponse, RunResult } from './types';
import { validateRunInput } from './validate';

const PROJECT = 'jev';

// The one thing the Jev Run module needs from OpenRouter.
export interface DecisionsClient {
  decide(request: DecisionsRequest): Promise<DecisionsResponse>;
}

type Access = Pick<ReturnType<typeof createAccess>, 'accessFor'>;

export function createJevRun(
  db: SiteDb,
  deps: { access: Access; client: DecisionsClient; now?: () => Date }
) {
  const now = deps.now ?? (() => new Date());

  async function run(user: AccessUser, input: unknown): Promise<RunResult> {
    const access = await deps.access.accessFor(user, PROJECT);
    if (access.status !== 'granted') {
      return {
        ok: false,
        error: {
          kind: 'no-access',
          message: 'Your account does not have access to the Jev Project.',
        },
      };
    }
    const valid = validateRunInput(input);
    if (!valid.ok)
      return {
        ok: false,
        error: { kind: 'invalid-input', message: valid.message },
      };
    const { request } = valid;
    const startedAt = now();
    let response: DecisionsResponse;
    try {
      response = await deps.client.decide(request);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // A failed call still reached OpenRouter, so it is logged too.
      await db.insert(runTable).values({
        userId: user.id,
        project: PROJECT,
        createdAt: startedAt,
        model: request.model,
        success: false,
        error: message,
      });
      return {
        ok: false,
        error: {
          kind: 'upstream',
          message: `The Jev model call failed: ${message}`,
        },
      };
    }
    await db.insert(runTable).values({
      userId: user.id,
      project: PROJECT,
      createdAt: startedAt,
      model: request.model,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      cost: response.usage.cost,
      success: true,
    });
    return { ok: true, response };
  }

  return { run };
}
