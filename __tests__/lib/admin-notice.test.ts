import { describe, it, expect } from 'vitest';
import { adminNotifier } from '@/lib/email/admin-notice';

type Call = { url: string; init: RequestInit };

function fakeFetch(status = 200) {
  const calls: Call[] = [];
  const fetch = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response('{}', { status });
  };
  return { calls, fetch: fetch as typeof globalThis.fetch };
}

const request = {
  user: { name: 'Pat Colleague', email: 'pat@example.com' },
  project: 'jev',
  note: 'I test prompts at work.',
};

describe('adminNotifier', () => {
  it('sends one email to the Admin through Resend, naming the User and the Project', async () => {
    const { calls, fetch } = fakeFetch();
    const notify = adminNotifier({
      apiKey: 're_test',
      adminEmail: 'jered@example.com',
      siteUrl: 'https://jeredleisey.com',
      fetch,
    });
    await notify!(request);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://api.resend.com/emails');
    expect(calls[0].init.method).toBe('POST');
    expect(new Headers(calls[0].init.headers).get('authorization')).toBe('Bearer re_test');
    const body = JSON.parse(String(calls[0].init.body));
    expect(body.from).toBe('jeredleisey.com <notifications@jeredleisey.com>');
    expect(body.to).toEqual(['jered@example.com']);
    expect(body.subject).toBe('Access Request for Jev prompt tester from Pat Colleague');
    expect(body.text).toContain('pat@example.com');
    expect(body.text).toContain('I test prompts at work.');
    expect(body.text).toContain('https://jeredleisey.com/admin/requests');
  });

  it('is off when there is no API key or no Admin email', () => {
    const { fetch } = fakeFetch();
    expect(adminNotifier({ apiKey: undefined, adminEmail: 'jered@example.com', siteUrl: 'https://x.test', fetch })).toBeUndefined();
    expect(adminNotifier({ apiKey: 're_test', adminEmail: undefined, siteUrl: 'https://x.test', fetch })).toBeUndefined();
  });

  it('fails when Resend refuses the email, so the caller can log it', async () => {
    const { fetch } = fakeFetch(422);
    const notify = adminNotifier({ apiKey: 're_test', adminEmail: 'jered@example.com', siteUrl: 'https://x.test', fetch });
    await expect(notify!(request)).rejects.toThrow(/422/);
  });
});
