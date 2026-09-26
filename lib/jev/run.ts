import { and, count, eq, gt, sql } from 'drizzle-orm';
import type { AccessUser, SiteDb, createAccess } from '@/lib/access';
import { run as runTable, runLimit, user as userTable } from '@/lib/db/schema';
import type { DecisionsRequest, DecisionsResponse, RunResult } from './types';
import { validateRunInput } from './validate';

const PROJECT = 'jev';

// Runs per User in any 24 hours, unless the Admin sets another limit.
export const DEFAULT_RUN_LIMIT = 50;
const WINDOW_MS = 24 * 60 * 60 * 1000;

// The one thing the Jev Run module needs from OpenRouter.
export interface DecisionsClient {
  decide(request: DecisionsRequest): Promise<DecisionsResponse>;
}

export interface RunUsage {
  runs: number;
  runsLast24Hours: number;
  cost: number;
  limit: number;
}

type Access = Pick<ReturnType<typeof createAccess>, 'accessFor' | 'isAdmin'>;

export function createJevRun(
  db: SiteDb,
  deps: { access: Access; client: DecisionsClient; now?: () => Date }
) {
  const now = deps.now ?? (() => new Date());

  async function limitFor(userId: string): Promise<number> {
    const [row] = await db.select({ limit: runLimit.limit }).from(runLimit).where(eq(runLimit.userId, userId));
    return row?.limit ?? DEFAULT_RUN_LIMIT;
  }

  // Every call that reached OpenRouter counts, failures too, over a rolling 24 hours.
  async function runsInWindow(userId: string): Promise<number> {
    const since = new Date(now().getTime() - WINDOW_MS);
    const [row] = await db
      .select({ n: count() })
      .from(runTable)
      .where(and(eq(runTable.userId, userId), gt(runTable.createdAt, since)));
    return row.n;
  }

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
    if (!deps.access.isAdmin(user) && (await runsInWindow(user.id)) >= (await limitFor(user.id))) {
      return {
        ok: false,
        error: {
          kind: 'limit-reached',
          message: 'You have used all your Runs for the last 24 hours. Try again later.',
        },
      };
    }
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

  // Runs left in the current 24 hours. null means no limit (the Admin).
  async function runsLeft(user: AccessUser): Promise<number | null> {
    if (deps.access.isAdmin(user)) return null;
    return Math.max(0, (await limitFor(user.id)) - (await runsInWindow(user.id)));
  }

  // The Admin sets a User's limit. 0 blocks every Run.
  async function setRunLimit(
    userId: string,
    limit: number,
  ): Promise<{ ok: true } | { ok: false; reason: 'invalid-limit' | 'not-found' }> {
    if (!Number.isInteger(limit) || limit < 0) return { ok: false, reason: 'invalid-limit' };
    const [found] = await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.id, userId));
    if (!found) return { ok: false, reason: 'not-found' };
    await db
      .insert(runLimit)
      .values({ userId, limit })
      .onConflictDoUpdate({ target: runLimit.userId, set: { limit } });
    return { ok: true };
  }

  // For the admin Users page: every User, with or without Runs.
  async function usageByUser(): Promise<Map<string, RunUsage>> {
    const since = new Date(now().getTime() - WINDOW_MS);
    const rows = await db
      .select({
        userId: userTable.id,
        runs: count(runTable.id),
        runsLast24Hours: sql<number>`count(${runTable.id}) filter (where ${runTable.createdAt} > ${since})`.mapWith(Number),
        // A Run with no reported cost adds nothing.
        cost: sql<number>`coalesce(sum(${runTable.cost}), 0)`.mapWith(Number),
        limit: runLimit.limit,
      })
      .from(userTable)
      .leftJoin(runTable, eq(runTable.userId, userTable.id))
      .leftJoin(runLimit, eq(runLimit.userId, userTable.id))
      .groupBy(userTable.id, runLimit.limit);
    return new Map(
      rows.map((r) => [
        r.userId,
        { runs: r.runs, runsLast24Hours: r.runsLast24Hours, cost: r.cost, limit: r.limit ?? DEFAULT_RUN_LIMIT },
      ]),
    );
  }

  return { run, runsLeft, setRunLimit, usageByUser };
}
