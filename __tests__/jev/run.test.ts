// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createTestDb } from '@/__tests__/db/harness';
import { createUser } from '@/__tests__/access/fixtures';
import { createAccess } from '@/lib/access';
import { createJevRun, type DecisionsClient } from '@/lib/jev/run';
import type { DecisionsRequest, DecisionsResponse } from '@/lib/jev/types';
import { run as runTable } from '@/lib/db/schema';

const ADMIN_EMAIL = 'admin@example.com';

const INPUT: DecisionsRequest = {
  model: '~typesafe/jev-latest',
  state: 'Help! My payouts have been failing for 3 days.',
  questions: {
    is_urgent: {
      type: 'noul',
      instructions: 'Does this message convey urgency?',
    },
  },
};

const RESPONSE: DecisionsResponse = {
  answers: { is_urgent: { type: 'noul', noul: 0.91 } },
  model: '~typesafe/jev-latest',
  usage: { inputTokens: 120, outputTokens: 8, cost: 0.0004 },
};

// A fake OpenRouter client that records each request and answers with a fixed result.
function fakeClient(
  answer: () => Promise<DecisionsResponse> = async () => RESPONSE
) {
  const calls: DecisionsRequest[] = [];
  const client: DecisionsClient = {
    async decide(request) {
      calls.push(request);
      return answer();
    },
  };
  return { client, calls };
}

async function setup(answer?: () => Promise<DecisionsResponse>) {
  const db = await createTestDb();
  const access = createAccess(db, { adminEmail: ADMIN_EMAIL });
  const fake = fakeClient(answer);
  const now = new Date('2026-09-26T12:00:00Z');
  const jev = createJevRun(db, { access, client: fake.client, now: () => now });
  return { db, access, jev, calls: fake.calls, now };
}

async function grantedUser(
  db: Awaited<ReturnType<typeof createTestDb>>,
  access: ReturnType<typeof createAccess>
) {
  const u = await createUser(db);
  const jevRole = await access.defaultRoleFor('jev');
  await access.assignRole(u, jevRole.id);
  return u;
}

describe('Jev Run module', () => {
  it('refuses a User without access and makes no OpenRouter call', async () => {
    const { db, jev, calls } = await setup();
    const u = await createUser(db);
    const result = await jev.run(u, INPUT);
    expect(result).toEqual({
      ok: false,
      error: { kind: 'no-access', message: expect.any(String) },
    });
    expect(calls).toHaveLength(0);
    expect(await db.select().from(runTable)).toHaveLength(0);
  });

  it('returns the response of a successful Run and logs it with tokens and cost', async () => {
    const { db, access, jev, calls, now } = await setup();
    const u = await grantedUser(db, access);
    const result = await jev.run(u, INPUT);
    expect(result).toEqual({ ok: true, response: RESPONSE });
    expect(calls).toEqual([INPUT]);
    expect(await db.select().from(runTable)).toEqual([
      expect.objectContaining({
        userId: u.id,
        project: 'jev',
        createdAt: now,
        model: '~typesafe/jev-latest',
        inputTokens: 120,
        outputTokens: 8,
        cost: 0.0004,
        success: true,
        error: null,
      }),
    ]);
  });

  it('logs a Run with an empty cost when the response has no cost', async () => {
    const noCost: DecisionsResponse = {
      ...RESPONSE,
      usage: { inputTokens: 50, outputTokens: 4 },
    };
    const { db, access, jev } = await setup(async () => noCost);
    const u = await grantedUser(db, access);
    const result = await jev.run(u, INPUT);
    expect(result).toEqual({ ok: true, response: noCost });
    const [logged] = await db.select().from(runTable);
    expect(logged).toMatchObject({
      inputTokens: 50,
      outputTokens: 4,
      cost: null,
      success: true,
    });
  });

  it('logs a failed OpenRouter call as a failure and returns an upstream error', async () => {
    const { db, access, jev, now } = await setup(async () => {
      throw new Error('Provider returned 503');
    });
    const u = await grantedUser(db, access);
    const result = await jev.run(u, INPUT);
    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'upstream',
        message: expect.stringContaining('Provider returned 503'),
      },
    });
    expect(await db.select().from(runTable)).toEqual([
      expect.objectContaining({
        userId: u.id,
        createdAt: now,
        model: '~typesafe/jev-latest',
        inputTokens: null,
        outputTokens: null,
        cost: null,
        success: false,
        error: 'Provider returned 503',
      }),
    ]);
  });

  it.each([
    ['no model', { ...INPUT, model: '' }],
    ['an empty state', { ...INPUT, state: '  ' }],
    ['no questions', { ...INPUT, questions: {} }],
    [
      'a question of an unknown type',
      { ...INPUT, questions: { q: { type: 'maybe', instructions: 'x' } } },
    ],
    [
      'a question with no instructions',
      { ...INPUT, questions: { q: { type: 'noul', instructions: '' } } },
    ],
    [
      'a choice question with no labels',
      {
        ...INPUT,
        questions: { q: { type: 'choice', instructions: 'x', criteria: {} } },
      },
    ],
    [
      'a score question with no levels',
      {
        ...INPUT,
        questions: { q: { type: 'score', instructions: 'x', criteria: [] } },
      },
    ],
    ['a body that is not an object', 'hello'],
  ])(
    'refuses input with %s before any OpenRouter call',
    async (_name, input) => {
      const { db, access, jev, calls } = await setup();
      const u = await grantedUser(db, access);
      const result = await jev.run(u, input);
      expect(result).toEqual({
        ok: false,
        error: { kind: 'invalid-input', message: expect.any(String) },
      });
      expect(calls).toHaveLength(0);
      expect(await db.select().from(runTable)).toHaveLength(0);
    }
  );
});
