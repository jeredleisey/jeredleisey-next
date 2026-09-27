import type { NewAccessRequest } from '@/lib/access';
import { getProject } from '@/lib/projects';

// The sender. Its domain is verified in Resend, with the records in Vercel DNS
// (docs/deployment.md).
const FROM = 'jeredleisey.com <notifications@jeredleisey.com>';
const RESEND_EMAILS = 'https://api.resend.com/emails';

export interface AdminNotifierConfig {
  apiKey: string | undefined;
  adminEmail: string | undefined;
  // The site's own address, for the link to the admin page.
  siteUrl: string;
  // Tests pass their own.
  fetch?: typeof globalThis.fetch;
}

// An email to the Admin for each new Access Request, sent through the Resend API.
// Off when there is no API key or no Admin email, as in local development and in
// previews. A refused email throws, and the Access module logs it.
export function adminNotifier({
  apiKey,
  adminEmail,
  siteUrl,
  fetch = globalThis.fetch,
}: AdminNotifierConfig): ((request: NewAccessRequest) => Promise<void>) | undefined {
  if (!apiKey || !adminEmail) return undefined;

  return async ({ user, project, note }) => {
    const projectTitle = getProject(project)?.title ?? project;
    const lines = [
      `${user.name} (${user.email}) asks for access to ${projectTitle}.`,
      '',
      note ? `Their note: ${note}` : 'They left no note.',
      '',
      `Approve or decline it here: ${new URL('/admin/requests', siteUrl)}`,
    ];
    const response = await fetch(RESEND_EMAILS, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [adminEmail],
        subject: `Access Request for ${projectTitle} from ${user.name}`,
        text: lines.join('\n'),
      }),
    });
    if (!response.ok) {
      throw new Error(`Resend refused the email: ${response.status} ${await response.text()}`);
    }
  };
}
