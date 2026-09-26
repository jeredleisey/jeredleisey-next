import { SubmitButton } from '@/components/SubmitButton';
import type { RoleSummary } from '@/lib/access';
import { PROJECTS, getProject } from '@/lib/projects';
import { AdminNav } from '../AdminNav';
import { adminPageAccess } from '../guard';
import { button, input, label, muted, row, smallButton, tag } from '../styles';
import {
  addPermissionAction,
  createRoleAction,
  deleteRoleAction,
  removePermissionAction,
  renameRoleAction,
} from './actions';
import { RoleNameForm } from './RoleNameForm';

export const metadata = { title: 'Roles — Jered Leisey' };

// Each protected Project is one Permission.
const PERMISSIONS = PROJECTS.filter((p) => p.protected);

export default async function RolesPage() {
  const access = await adminPageAccess('/admin/roles');

  const roles = await access.listRoles();

  return (
    <div className="p-pad-2 max-w-2xl">
      <AdminNav current="/admin/roles" />
      <h1 className={`${label} mb-pad-2`}>Roles ({roles.length})</h1>

      <section className="mb-pad-2">
        <h2 className="text-my-orange text-xs uppercase tracking-widest mb-3">New Role</h2>
        <RoleNameForm
          action={createRoleAction}
          fieldLabel="Role name"
          submitLabel="Create"
          pendingLabel="Creating…"
        />
      </section>

      <ul>
        {roles.map((r) => (
          <RoleRow key={r.id} role={r} />
        ))}
      </ul>
    </div>
  );
}

function RoleRow({ role }: { role: RoleSummary }) {
  const isDefault = role.defaultForProject !== null;
  const defaultTitle = role.defaultForProject
    ? (getProject(role.defaultForProject)?.title ?? role.defaultForProject)
    : null;
  const addable = PERMISSIONS.filter((p) => !role.permissions.includes(p.slug));

  return (
    <li className={row}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <span className="text-my-espresso dark:text-my-cream text-sm">{role.name}</span>
        <span className={label}>
          {role.memberCount} {role.memberCount === 1 ? 'User' : 'Users'}
        </span>
      </div>
      {defaultTitle && (
        <p className={`${muted} mb-3`}>
          The default Role of {defaultTitle}. Approvals use it unless you pick another Role. It
          cannot be deleted, and it keeps the Permission for {defaultTitle}.
        </p>
      )}

      <RoleNameForm
        action={renameRoleAction}
        roleId={role.id}
        defaultName={role.name}
        fieldLabel={`New name for ${role.name}`}
        submitLabel="Rename"
        pendingLabel="Renaming…"
      />

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className={label}>Permissions</span>
        {role.permissions.length === 0 && <span className={muted}>None</span>}
        {role.permissions.map((slug) => {
          const title = getProject(slug)?.title ?? slug;
          return (
            <span key={slug} className={tag}>
              {title}
              {role.defaultForProject !== slug && (
                <form action={removePermissionAction} className="inline-flex">
                  <input type="hidden" name="roleId" value={role.id} />
                  <input type="hidden" name="project" value={slug} />
                  <SubmitButton pendingLabel="…" className={smallButton}>
                    <span aria-hidden="true">×</span>
                    <span className="sr-only">
                      Remove {title} from {role.name}
                    </span>
                  </SubmitButton>
                </form>
              )}
            </span>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3">
        {addable.length > 0 && (
          <form action={addPermissionAction} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="roleId" value={role.id} />
            <label>
              <span className="sr-only">Project to add to {role.name}</span>
              <select name="project" className={input}>
                {addable.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
            <SubmitButton pendingLabel="Adding…" className={button}>
              Add Permission
            </SubmitButton>
          </form>
        )}
        {!isDefault && (
          <form action={deleteRoleAction}>
            <input type="hidden" name="roleId" value={role.id} />
            <SubmitButton pendingLabel="Deleting…" className={button}>
              Delete Role
            </SubmitButton>
          </form>
        )}
      </div>
    </li>
  );
}
