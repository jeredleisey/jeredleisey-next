import { SubmitButton } from '@/components/SubmitButton';
import type { AccessRequestInfo, RoleSummary } from '@/lib/access';
import { formatDate } from '@/lib/format';
import { getProject } from '@/lib/projects';
import { AdminNav } from '../AdminNav';
import { adminPageAccess } from '../guard';
import { button, input, label, muted, row } from '../styles';
import { approveRequestAction, declineRequestAction } from './actions';

export const metadata = { title: 'Access Requests — Jered Leisey' };

export default async function AccessRequestsPage() {
  const access = await adminPageAccess('/admin/requests');

  const { pending, past } = await access.listRequests();
  const roles = await access.listRoles();

  return (
    <div className="p-pad-2 max-w-2xl">
      <AdminNav current="/admin/requests" />
      <h1 className={`${label} mb-pad-2`}>Access Requests</h1>

      <section className="mb-pad-2">
        <h2 className="text-my-orange text-xs uppercase tracking-widest mb-3">
          Pending ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className={muted}>No request waits for a decision.</p>
        ) : (
          <ul>
            {pending.map((request) => (
              <RequestRow key={request.id} request={request}>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <form action={approveRequestAction} className="flex flex-wrap items-center gap-3">
                    <input type="hidden" name="requestId" value={request.id} />
                    <RolePicker roles={roles} project={request.project} />
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
          <p className={muted}>No request has a decision yet.</p>
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

// The Role to approve into. The Project's default Role is preselected.
function RolePicker({ roles, project }: { roles: RoleSummary[]; project: string }) {
  const defaultRole = roles.find((r) => r.defaultForProject === project);
  return (
    <label className="flex items-center gap-2">
      <span className={label}>Role</span>
      <select name="roleId" defaultValue={defaultRole?.id ?? ''} className={input}>
        {!defaultRole && <option value="">Default Role</option>}
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
            {r.permissions.includes(project) ? '' : ' (does not open this Project)'}
          </option>
        ))}
      </select>
    </label>
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
    <li className={row}>
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
