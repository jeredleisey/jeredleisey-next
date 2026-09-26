import 'server-only';
import { getAccess } from '@/lib/access/server';
import { getDb } from '@/lib/db';
import { createOpenRouterClient } from './openrouter';
import { createJevRun } from './run';

type JevRun = ReturnType<typeof createJevRun>;

let jev: Promise<JevRun> | undefined;

// The Jev Run module on the real database and the real OpenRouter client.
// It is made on the first Run, which is when the key is first read.
export function getJevRun(): Promise<JevRun> {
  jev ??= (async () => {
    const client = createOpenRouterClient();
    const access = await getAccess();
    return createJevRun(getDb(), { access, client });
  })().catch((err) => {
    jev = undefined;
    throw err;
  });
  return jev;
}

type JevLimits = Pick<JevRun, 'runsLeft' | 'setRunLimit' | 'usageByUser'>;

let limits: Promise<JevLimits> | undefined;

// Run limits and usage, without the OpenRouter key: pages that only show
// or set limits must work even when the key is missing. This instance
// refuses every call, so it can never make a Run.
export function getJevLimits(): Promise<JevLimits> {
  limits ??= (async () => {
    const access = await getAccess();
    const noCalls = {
      decide: () => Promise.reject(new Error('This instance only reads and sets Run limits.')),
    };
    return createJevRun(getDb(), { access, client: noCalls });
  })().catch((err) => {
    limits = undefined;
    throw err;
  });
  return limits;
}
