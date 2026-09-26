import { requestAccessAction } from '@/app/projects/actions';
import { SubmitButton } from '@/components/SubmitButton';
import { NOTE_MAX_LENGTH, type Access } from '@/lib/access';
import { formatDate } from '@/lib/format';
import type { Project } from '@/lib/projects';

type NoAccess = Exclude<Access, { status: 'granted' }>;

// Shown to a signed-in User who does not have a Project's Permission.
export function AccessSplash({ project, access }: { project: Project; access: NoAccess }) {
  return (
    <div className="p-pad-2 max-w-lg">
      <p className="text-my-orange text-xs uppercase tracking-widest mb-3">Access needed</p>
      <h1 className="text-2xl font-light text-my-espresso dark:text-my-cream mb-3">{project.title}</h1>
      <p className="text-my-walnut dark:text-my-stone text-sm leading-relaxed mb-pad-2">
        {project.description}
      </p>
      {access.status === 'pending' && (
        <StateNote label="Request pending">
          Your Access Request waits for a decision. This page opens when Jered approves it.
        </StateNote>
      )}
      {access.status === 'declined' && (
        <StateNote label="Request declined">
          Your Access Request was declined. You can ask again after {formatDate(access.retryAfter)}.
        </StateNote>
      )}
      {access.status === 'none' && <RequestForm project={project} />}
    </div>
  );
}

function StateNote({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-my-stone/40 dark:border-my-stone/20 px-4 py-3">
      <p className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-2">
        {label}
      </p>
      <p className="text-my-espresso dark:text-my-cream text-sm font-light leading-relaxed">
        {children}
      </p>
    </div>
  );
}

function RequestForm({ project }: { project: Project }) {
  const action = requestAccessAction.bind(null, project.slug);
  return (
    <form action={action} className="flex flex-col gap-3">
      <p className="text-my-espresso dark:text-my-cream text-sm font-light leading-relaxed">
        Your account does not have access to this Project yet. Send an Access Request, and Jered
        will decide on it.
      </p>
      <label
        htmlFor="note"
        className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mt-2"
      >
        Note (optional)
      </label>
      <textarea
        id="note"
        name="note"
        rows={3}
        maxLength={NOTE_MAX_LENGTH}
        placeholder="Tell Jered who you are and why you want access."
        className="border border-my-stone/40 dark:border-my-stone/20 bg-transparent px-4 py-3 text-sm font-light text-my-espresso dark:text-my-cream placeholder:text-my-walnut/60 dark:placeholder:text-my-stone/60 focus:border-my-orange focus:outline-none"
      />
      <SubmitButton
        pendingLabel="Sending…"
        className="self-start border border-my-stone/40 dark:border-my-stone/20 px-4 py-3 text-sm text-my-espresso dark:text-my-cream hover:border-my-orange hover:text-my-orange disabled:opacity-50 transition-colors"
      >
        Request access
      </SubmitButton>
    </form>
  );
}
