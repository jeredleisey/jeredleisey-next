// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createTestDb } from '@/__tests__/db/harness';
import { createUser } from '@/__tests__/access/fixtures';
import { createAccess, type AccessUser } from '@/lib/access';
import { role, rolePermission } from '@/lib/db/schema';

const ADMIN_EMAIL = 'admin@example.com';

// A clock that the test moves forward by hand.
function testClock(start = '2026-09-01T12:00:00Z') {
  let current = new Date(start);
  return {
    now: () => current,
    advanceDays(days: number) {
      current = new Date(current.getTime() + days * 24 * 60 * 60 * 1000);
    },
  };
}

async function sendAndDecline(access: ReturnType<typeof createAccess>, u: AccessUser) {
  const sent = await access.requestAccess(u, 'jev');
  if (!sent.ok) throw new Error('request refused');
  await access.decline(sent.requestId);
}

async function setup() {
  const db = await createTestDb();
  const clock = testClock();
  const access = createAccess(db, { adminEmail: ADMIN_EMAIL, now: clock.now });
  return { db, clock, access };
}

describe('Access Requests', () => {
  it('shows a User with a sent Access Request as pending', async () => {
    const { db, access } = await setup();
    const u = await createUser(db);
    const result = await access.requestAccess(u, 'jev', 'I test prompts at work.');
    expect(result.ok).toBe(true);
    expect(await access.accessFor(u, 'jev')).toEqual({ status: 'pending' });
  });

  it('refuses a second Access Request while one is pending', async () => {
    const { db, access } = await setup();
    const u = await createUser(db);
    await access.requestAccess(u, 'jev');
    expect(await access.requestAccess(u, 'jev')).toEqual({ ok: false, reason: 'pending' });
  });

  it('grants a User after the Admin approves the request into the default Role', async () => {
    const { db, access } = await setup();
    const u = await createUser(db);
    const sent = await access.requestAccess(u, 'jev');
    if (!sent.ok) throw new Error('request refused');
    expect(await access.approve(sent.requestId)).toEqual({ ok: true });
    expect(await access.accessFor(u, 'jev')).toEqual({ status: 'granted' });
  });

  it('shows a declined User the date 7 days after the decline', async () => {
    const { db, clock, access } = await setup();
    const u = await createUser(db);
    const sent = await access.requestAccess(u, 'jev');
    if (!sent.ok) throw new Error('request refused');
    clock.advanceDays(1);
    expect(await access.decline(sent.requestId)).toEqual({ ok: true });
    expect(await access.accessFor(u, 'jev')).toEqual({
      status: 'declined',
      retryAfter: new Date('2026-09-09T12:00:00Z'),
    });
  });

  it('refuses a request within 7 days of a decline', async () => {
    const { db, clock, access } = await setup();
    const u = await createUser(db);
    await sendAndDecline(access, u);
    clock.advanceDays(6);
    expect(await access.requestAccess(u, 'jev')).toEqual({
      ok: false,
      reason: 'declined',
      retryAfter: new Date('2026-09-08T12:00:00Z'),
    });
  });

  it('accepts a new request from a declined User after 7 days', async () => {
    const { db, clock, access } = await setup();
    const u = await createUser(db);
    await sendAndDecline(access, u);
    clock.advanceDays(7);
    expect(await access.accessFor(u, 'jev')).toEqual({ status: 'none' });
    const again = await access.requestAccess(u, 'jev');
    expect(again.ok).toBe(true);
    expect(await access.accessFor(u, 'jev')).toEqual({ status: 'pending' });
  });

  it('lists pending and past requests with the User, the Project, the note, and the dates', async () => {
    const { db, clock, access } = await setup();
    const ana = await createUser(db);
    const ben = await createUser(db);
    const cy = await createUser(db);
    const a = await access.requestAccess(ana, 'jev', 'For the support team.');
    const b = await access.requestAccess(ben, 'jev');
    clock.advanceDays(1);
    await access.requestAccess(cy, 'jev', 'Please.');
    if (!a.ok || !b.ok) throw new Error('request refused');
    clock.advanceDays(1);
    await access.approve(a.requestId);
    clock.advanceDays(1);
    await access.decline(b.requestId);

    const { pending, past } = await access.listRequests();

    expect(pending).toEqual([
      {
        id: expect.any(String),
        user: { id: cy.id, name: cy.name, email: cy.email },
        project: 'jev',
        note: 'Please.',
        status: 'pending',
        createdAt: new Date('2026-09-02T12:00:00Z'),
        decidedAt: null,
        roleName: null,
      },
    ]);
    // The latest decision comes first.
    expect(past).toEqual([
      expect.objectContaining({ id: b.requestId, status: 'declined', note: null, roleName: null }),
      expect.objectContaining({
        id: a.requestId,
        user: { id: ana.id, name: ana.name, email: ana.email },
        note: 'For the support team.',
        status: 'approved',
        createdAt: new Date('2026-09-01T12:00:00Z'),
        decidedAt: new Date('2026-09-03T12:00:00Z'),
        roleName: 'Jev testers',
      }),
    ]);
  });

  it('reports an unknown request instead of a decision', async () => {
    const { access } = await setup();
    for (const id of ['not-a-request-id', '00000000-0000-4000-8000-000000000000']) {
      expect(await access.approve(id)).toEqual({ ok: false, reason: 'not-found' });
      expect(await access.decline(id)).toEqual({ ok: false, reason: 'not-found' });
    }
  });

  it('does not decide a request a second time', async () => {
    const { db, access } = await setup();
    const u = await createUser(db);
    const sent = await access.requestAccess(u, 'jev');
    if (!sent.ok) throw new Error('request refused');
    await access.decline(sent.requestId);
    expect(await access.approve(sent.requestId)).toEqual({ ok: false, reason: 'not-pending' });
    expect(await access.decline(sent.requestId)).toEqual({ ok: false, reason: 'not-pending' });
    expect(await access.accessFor(u, 'jev')).toMatchObject({ status: 'declined' });
  });

  it('approves a request into a Role that the Admin chooses', async () => {
    const { db, access } = await setup();
    const u = await createUser(db);
    const [colleagues] = await db.insert(role).values({ name: 'Colleagues' }).returning();
    await db.insert(rolePermission).values({ roleId: colleagues.id, permission: 'jev' });
    const sent = await access.requestAccess(u, 'jev');
    if (!sent.ok) throw new Error('request refused');
    await access.approve(sent.requestId, colleagues.id);
    expect(await access.accessFor(u, 'jev')).toEqual({ status: 'granted' });
    const { past } = await access.listRequests();
    expect(past[0].roleName).toBe('Colleagues');
  });

  it('refuses a request from a User who already has access', async () => {
    const { db, access } = await setup();
    const admin = await createUser(db, { email: ADMIN_EMAIL });
    expect(await access.requestAccess(admin, 'jev')).toEqual({ ok: false, reason: 'granted' });
  });

  it('keeps the note short, and stores a blank note as no note', async () => {
    const { db, access } = await setup();
    const blank = await createUser(db);
    const long = await createUser(db);
    await access.requestAccess(blank, 'jev', '   ');
    await access.requestAccess(long, 'jev', 'x'.repeat(600));
    const { pending } = await access.listRequests();
    expect(pending.find((r) => r.user.id === blank.id)?.note).toBeNull();
    expect(pending.find((r) => r.user.id === long.id)?.note).toHaveLength(500);
  });
});
