'use client';

import { useActionState } from 'react';
import { button, input } from '../styles';

export interface RoleNameState {
  error: string | null;
  // The name that the server refused, so the field keeps it.
  name?: string;
}

const initialState: RoleNameState = { error: null };

// A form for a Role name that shows the reason when the server refuses it.
// It serves both to create a Role and to rename one.
export function RoleNameForm({
  action,
  roleId,
  defaultName = '',
  fieldLabel,
  submitLabel,
  pendingLabel,
}: {
  action: (state: RoleNameState, formData: FormData) => Promise<RoleNameState>;
  roleId?: string;
  defaultName?: string;
  fieldLabel: string;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <form action={formAction}>
      <div className="flex flex-wrap items-center gap-3">
        {roleId && <input type="hidden" name="roleId" value={roleId} />}
        <label className="flex-1 min-w-[12rem]">
          <span className="sr-only">{fieldLabel}</span>
          <input
            type="text"
            name="name"
            defaultValue={state.error ? state.name : defaultName}
            placeholder={fieldLabel}
            required
            className={`${input} w-full`}
          />
        </label>
        <button type="submit" disabled={pending} className={button}>
          {pending ? pendingLabel : submitLabel}
        </button>
      </div>
      <p aria-live="polite" className="text-my-orange text-xs mt-2 empty:hidden">
        {state.error}
      </p>
    </form>
  );
}
