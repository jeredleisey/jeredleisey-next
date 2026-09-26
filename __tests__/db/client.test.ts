// @vitest-environment node
import { describe, it, expect, afterEach, vi } from 'vitest';

describe('runtime database client', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('does not need DATABASE_URL until first use', async () => {
    vi.stubEnv('DATABASE_URL', '');
    await expect(import('@/lib/db')).resolves.toBeDefined();
  });

  it('fails with a clear message when DATABASE_URL is missing', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const { getDb } = await import('@/lib/db');
    expect(() => getDb()).toThrow(/DATABASE_URL is not set/);
  });

  it('returns the same client on every call', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@example.neon.tech/db');
    const { getDb } = await import('@/lib/db');
    expect(getDb()).toBe(getDb());
  });
});
