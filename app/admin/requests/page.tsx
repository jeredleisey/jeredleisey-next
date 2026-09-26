import { notFound, redirect } from 'next/navigation';
import { SubmitButton } from '@/components/SubmitButton';
import type { AccessRequestInfo } from '@/lib/access';
import { getAccess, getSessionUser } from '@/lib/access/server';
import { formatDate } from '@/lib/format';
import { getProject } from '@/lib/projects';
import { approveRequestAction, declineRequestAction } from './actions';

export const metadata = { title: 'Access Requests — Jered Leisey' };

const label = 'text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest';
const button =
  'border border-my-stone/40 dark:border-my-stone/20 px-4 py-2 text-xs uppercase tracking-widest text-my-espresso dark:text-my-cream hover:border-my-orange hover:text-my-orange disabled:opacity-50 transition-colors';

export default async function AccessRequestsPage() {
  // proxy.ts only checks for a cookie. The real checks happen here.
  const user = await getSessionUser();
  if (!user) redirect('/sign-in?next=/admin/requests');
  const access = await getAccess();
  if (!access.isAdmin(user)) notFound();

  const { pending, past } = await access.listRequests();

  return (
    <div className="p-pad-2 max-w-2xl">
      <h1 className={`${label} mb-pad-2`}>Access Requests</h1>

      <section className="mb-pad-2">
        <h2 className="text-my-orange text-xs uppercase tracking-widest mb-3">
          Pending ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-my-walnut dark:text-my-stone text-sm font-light">
            No request waits for a decision.
          </p>
        ) : (
          <ul>
            {pending.map((request) => (
              <RequestRow key={request.id} request={request}>
                <div className="flex gap-3 mt-3">
                  <form action={approveRequestAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <SubmitButton pendingLabel="Approving…" className={button}>
                      Approve
                    </SubmitButton>
                  </form>
                  <form action={declineRequestAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <SubmitButton pendingLabel="Declining…" className={button}>
                      Decline
                    </SubmitButton>
                  </form>
                </div>
              </RequestRow>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className={`${label} mb-3`}>Past ({past.length})</h2>
        {past.length === 0 ? (
          <p className="text-my-walnut dark:text-my-stone text-sm font-light">
            No request has a decision yet.
          </p>
        ) : (
          <ul>
            {past.map((request) => (
              <RequestRow key={request.id} request={request} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function RequestRow({
  request,
  children,
}: {
  request: AccessRequestInfo;
  children?: React.ReactNode;
}) {
  const projectTitle = getProject(request.project)?.title ?? request.project;
  return (
    <li className="border-b border-my-stone/30 dark:border-my-espresso/30 last:border-0 py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-my-espresso dark:text-my-cream text-sm">
          {request.user.name}{' '}
          <span className="text-my-walnut dark:text-my-stone font-light">{request.user.email}</span>
        </span>
        <span className={label}>{projectTitle}</span>
      </div>
      {request.note && (
        <p className="text-my-espresso dark:text-my-cream text-sm font-light leading-relaxed mt-2 whitespace-pre-line">
          {request.note}
        </p>
      )}
      <p className="text-my-walnut dark:text-my-stone text-xs mt-2">
        Sent {formatDate(request.createdAt)}
        {request.decidedAt && (
          <>
            {' · '}
            <span className={request.status === 'approved' ? 'text-my-orange' : undefined}>
              {request.status === 'approved' ? 'Approved' : 'Declined'}
            </span>{' '}
            {formatDate(request.decidedAt)}
            {request.roleName && ` into ${request.roleName}`}
          </>
        )}
      </p>
      {children}
    </li>
  );
}
