import type { Project } from '@/lib/projects';

// Shown to a signed-in User who does not have a Project's Permission.
export function AccessSplash({ project }: { project: Project }) {
  return (
    <div className="p-pad-2 max-w-lg">
      <p className="text-my-orange text-xs uppercase tracking-widest mb-3">Access needed</p>
      <h1 className="text-2xl font-light text-my-espresso dark:text-my-cream mb-3">{project.title}</h1>
      <p className="text-my-walnut dark:text-my-stone text-sm leading-relaxed mb-pad-2">
        {project.description}
      </p>
      <p className="text-my-espresso dark:text-my-cream text-sm font-light leading-relaxed">
        Your account does not have access to this Project yet.
      </p>
    </div>
  );
}
