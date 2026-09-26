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
