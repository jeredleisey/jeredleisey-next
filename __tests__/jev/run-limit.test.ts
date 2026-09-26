// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createTestDb, type TestDb } from '@/__tests__/db/harness';
import { createUser } from '@/__tests__/access/fixtures';
import { createAccess } from '@/lib/access';
import { createJevRun, type DecisionsClient } from '@/lib/jev/run';
import type { DecisionsRequest, DecisionsResponse } from '@/lib/jev/types';

const ADMIN_EMAIL = 'admin@example.com';
const HOUR = 60 * 60 * 1000;

const INPUT: DecisionsRequest = {
  model: '~typesafe/jev-latest',
  state: 'Help! My payouts have been failing for 3 days.',
  questions: { is_urgent: { type: 'noul', instructions: 'Does this message convey urgency?' } },
};

const RESPONSE: DecisionsResponse = {
  answers: { is_urgent: { type: 'noul', noul: 0.91 } },
  model: '~typesafe/jev-latest',
  usage: { inputTokens: 120, outputTokens: 8, cost: 0.0004 },
};

async function setup(answer: () => Promise<DecisionsResponse> = async () => RESPONSE) {
  const db = await createTestDb();
  const access = createAccess(db, { adminEmail: ADMIN_EMAIL });
  let calls = 0;
  const client: DecisionsClient = {
    async decide() {
      calls += 1;
      return answer();
    },
  };
  // A clock the tests move forward.
  let time = new Date('2026-09-26T12:00:00Z').getTime();
  const clock = {
    advance: (ms: number) => {
      time += ms;
    },
  };
  const jev = createJevRun(db, { access, client, now: () => new Date(time) });
  return { db, access, jev, clock, calls: () => calls };
}

async function grantedUser(db: TestDb, access: ReturnType<typeof createAccess>) {
  const u = await createUser(db);
  await access.assignRole(u, (await access.defaultRoleFor('jev')).id);
  return u;
}

async function runTimes(jev: { run: (u: never, i: unknown) => Promise<unknown> }, u: unknown, n: number) {
  for (let i = 0; i < n; i += 1) await jev.run(u as never, INPUT);
}

describe('daily Run limit', () => {
  it('lets a User make 50 Runs in 24 hours and refuses the 51st without a call', async () => {
    const { db, access, jev, calls } = await setup();
    const u = await grantedUser(db, access);
    await runTimes(jev, u, 50);
    expect(calls()).toBe(50);

    const result = await jev.run(u, INPUT);
    expect(result).toEqual({ ok: false, error: { kind: 'limit-reached', message: expect.any(String) } });
    expect(calls()).toBe(50);
  });

  it('stops counting a Run 24 hours after it was made', async () => {
    const { db, access, jev, clock } = await setup();
    const u = await grantedUser(db, access);
    await runTimes(jev, u, 50);
    clock.advance(24 * HOUR - 1);
    expect(await jev.run(u, INPUT)).toMatchObject({ ok: false, error: { kind: 'limit-reached' } });
    clock.advance(1);
    expect(await jev.run(u, INPUT)).toMatchObject({ ok: true });
  });

  it('counts a failed OpenRouter call toward the limit', async () => {
    const { db, access, jev } = await setup(async () => {
      throw new Error('provider is down');
    });
    const u = await grantedUser(db, access);
    await runTimes(jev, u, 50);
    expect(await jev.run(u, INPUT)).toMatchObject({ ok: false, error: { kind: 'limit-reached' } });
  });

  it('uses a limit that the Admin sets for a User', async () => {
    const { db, access, jev, calls } = await setup();
    const u = await grantedUser(db, access);
    expect(await jev.setRunLimit(u.id, 2)).toEqual({ ok: true });
    await runTimes(jev, u, 2);
    expect(await jev.run(u, INPUT)).toMatchObject({ ok: false, error: { kind: 'limit-reached' } });
    expect(calls()).toBe(2);
  });

  it('refuses a limit that is not a whole number of 0 or more', async () => {
    const { db, access, jev } = await setup();
    const u = await grantedUser(db, access);
    for (const bad of [-1, 1.5, Number.NaN]) {
      expect(await jev.setRunLimit(u.id, bad)).toEqual({ ok: false, reason: 'invalid-limit' });
    }
    expect(await jev.setRunLimit('no-such-user', 5)).toEqual({ ok: false, reason: 'not-found' });
  });

  it('blocks every Run for a User with a limit of 0', async () => {
    const { db, access, jev, calls } = await setup();
    const u = await grantedUser(db, access);
    await jev.setRunLimit(u.id, 0);
    expect(await jev.run(u, INPUT)).toMatchObject({ ok: false, error: { kind: 'limit-reached' } });
    expect(calls()).toBe(0);
  });

  it('never refuses the Admin for the limit', async () => {
    const { db, jev, calls } = await setup();
    const admin = await createUser(db, { email: ADMIN_EMAIL });
    await jev.setRunLimit(admin.id, 0);
    await runTimes(jev, admin, 3);
    expect(calls()).toBe(3);
  });

  it('reports the Runs left in the last 24 hours, and no limit for the Admin', async () => {
    const { db, access, jev, clock } = await setup();
    const u = await grantedUser(db, access);
    expect(await jev.runsLeft(u)).toBe(50);
    await runTimes(jev, u, 3);
    expect(await jev.runsLeft(u)).toBe(47);
    await jev.setRunLimit(u.id, 2);
    expect(await jev.runsLeft(u)).toBe(0);
    clock.advance(24 * HOUR);
    expect(await jev.runsLeft(u)).toBe(2);

    const admin = await createUser(db, { email: ADMIN_EMAIL });
    expect(await jev.runsLeft(admin)).toBeNull();
  });

  it('reports Runs, Runs in the last 24 hours, cost, and limit for each User', async () => {
    let cost: number | undefined = 0.25;
    const { db, access, jev, clock } = await setup(async () => ({ ...RESPONSE, usage: { ...RESPONSE.usage, cost } }));
    const busy = await grantedUser(db, access);
    const idle = await grantedUser(db, access);
    await runTimes(jev, busy, 2);
    clock.advance(25 * HOUR);
    cost = undefined;
    await runTimes(jev, busy, 1);
    await jev.setRunLimit(idle.id, 10);

    const usage = await jev.usageByUser();
    expect(usage.get(busy.id)).toEqual({ runs: 3, runsLast24Hours: 1, cost: 0.5, limit: 50 });
    expect(usage.get(idle.id)).toEqual({ runs: 0, runsLast24Hours: 0, cost: 0, limit: 10 });
  });
});
