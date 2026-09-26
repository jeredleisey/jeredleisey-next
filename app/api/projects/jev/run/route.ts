import { getSessionUser } from '@/lib/access/server';
import { getJevRun } from '@/lib/jev/server';
import type { RunErrorKind, RunResult } from '@/lib/jev/types';

const STATUS: Record<RunErrorKind, number> = {
  unauthenticated: 401,
  'no-access': 403,
  'invalid-input': 400,
  upstream: 502,
};

function failure(kind: RunErrorKind, message: string) {
  const body: RunResult = { ok: false, error: { kind, message } };
  return Response.json(body, { status: STATUS[kind] });
}

// One Run of the Jev Project. The page posts { model, state, questions }.
// The Jev Run module checks access and input and logs the call.
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user)
    return failure('unauthenticated', 'Sign in to use the Jev Project.');

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return failure('invalid-input', 'The request body is not valid JSON.');
  }

  let result: RunResult;
  try {
    result = await (await getJevRun()).run(user, input);
  } catch (err) {
    console.error('Jev Run failed on the server', err);
    const body: RunResult = {
      ok: false,
      error: {
        kind: 'upstream',
        message: 'The server could not make the Run. Try again later.',
      },
    };
    return Response.json(body, { status: 500 });
  }

  if (!result.ok)
    return Response.json(result, { status: STATUS[result.error.kind] });
  return Response.json(result);
}
