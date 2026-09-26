import { SubmitButton } from '@/components/SubmitButton';
import type { RoleSummary, UserSummary } from '@/lib/access';
import { formatDate } from '@/lib/format';
import type { RunUsage } from '@/lib/jev/run';
import { getJevLimits } from '@/lib/jev/server';
import { AdminNav } from '../AdminNav';
import { adminPageAccess } from '../guard';
import { button, input, label, muted, row, smallButton, tag } from '../styles';
import { assignRoleAction, removeRoleAction, setRunLimitAction } from './actions';

export const metadata = { title: 'Users — Jered Leisey' };

const PROVIDER_NAMES: Record<string, string> = { google: 'Google', github: 'GitHub' };

export default async function UsersPage() {
  const access = await adminPageAccess('/admin/users');

  const users = await access.listUsers();
  const roles = await access.listRoles();
  const usage = await (await getJevLimits()).usageByUser();

  return (
    <div className="p-pad-2 max-w-2xl">
      <AdminNav current="/admin/users" />
      <h1 className={`${label} mb-pad-2`}>Users ({users.length})</h1>
      {users.length === 0 ? (
        <p className={muted}>Nobody has signed in yet.</p>
      ) : (
        <ul>
          {users.map((u) => (
            <UserRow key={u.id} user={u} roles={roles} usage={usage.get(u.id)} isAdmin={access.isAdmin(u)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function formatCost(usd: number) {
  return `$${usd.toFixed(usd > 0 && usd < 0.01 ? 6 : 2)}`;
}

function UserRow({
  user,
  roles,
  usage,
  isAdmin,
}: {
  user: UserSummary;
  roles: RoleSummary[];
  usage: RunUsage | undefined;
  isAdmin: boolean;
}) {
  const held = new Set(user.roles.map((r) => r.id));
  const assignable = roles.filter((r) => !held.has(r.id));
  const providers = user.providers.map((p) => PROVIDER_NAMES[p] ?? p).join(', ');

  return (
    <li className={row}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-my-espresso dark:text-my-cream text-sm">
          {user.name}{' '}
          <span className="text-my-walnut dark:text-my-stone font-light">{user.email}</span>
        </span>
        <span className={label}>{providers || 'No provider'}</span>
      </div>
      <p className="text-my-walnut dark:text-my-stone text-xs mt-2">
        Signed up {formatDate(user.createdAt)}
      </p>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className={label}>Roles</span>
        {user.roles.length === 0 && <span className={muted}>None</span>}
        {user.roles.map((r) => (
          <form key={r.id} action={removeRoleAction} className={tag}>
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="roleId" value={r.id} />
            {r.name}
            <SubmitButton pendingLabel="…" className={smallButton}>
              <span aria-hidden="true">×</span>
              <span className="sr-only">
                Remove {r.name} from {user.name}
              </span>
            </SubmitButton>
          </form>
        ))}
      </div>

      {usage && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-3">
          <span className="text-xs text-my-espresso dark:text-my-cream">
            <span className={label}>Runs</span> {usage.runs}{' '}
            <span className="text-my-walnut dark:text-my-stone">({usage.runsLast24Hours} in 24 h)</span>
          </span>
          <span className="text-xs text-my-espresso dark:text-my-cream">
            <span className={label}>Cost</span> {formatCost(usage.cost)}
          </span>
          {isAdmin ? (
            <span className={muted}>No Run limit</span>
          ) : (
            <form action={setRunLimitAction} className="flex items-center gap-2">
              <input type="hidden" name="userId" value={user.id} />
              <label htmlFor={`limit-${user.id}`} className={label}>
                Limit per 24 h
              </label>
              <input
                id={`limit-${user.id}`}
                name="limit"
                type="number"
                min={0}
                step={1}
                required
                defaultValue={usage.limit}
                className={`${input} w-20`}
              />
              <SubmitButton pendingLabel="Saving…" className={button}>
                Save
              </SubmitButton>
            </form>
          )}
        </div>
      )}

      {assignable.length > 0 && (
        <form action={assignRoleAction} className="flex flex-wrap items-center gap-3 mt-3">
          <input type="hidden" name="userId" value={user.id} />
          <label className="flex items-center gap-2">
            <span className="sr-only">Role to assign to {user.name}</span>
            <select name="roleId" className={input}>
              {assignable.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <SubmitButton pendingLabel="Assigning…" className={button}>
            Assign
          </SubmitButton>
        </form>
      )}
    </li>
  );
}
