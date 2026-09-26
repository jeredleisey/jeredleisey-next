import { redirect } from 'next/navigation';
import { AccessSplash } from '@/components/AccessSplash';
import { OptionsPanel } from '@/components/jev/OptionsPanel';
import { getAccess, getSessionUser } from '@/lib/access/server';
import { getJevLimits } from '@/lib/jev/server';
import { getProject } from '@/lib/projects';

const project = getProject('jev')!;

export const metadata = { title: `${project.title} — Jered Leisey` };

export default async function JevProjectPage() {
  // proxy.ts only checks for a cookie. The real checks happen here.
  const user = await getSessionUser();
  if (!user) redirect(`/sign-in?next=/projects/${project.slug}`);

  const access = await (await getAccess()).accessFor(user, project.slug);
  if (access.status !== 'granted') return <AccessSplash project={project} access={access} />;

  const runsLeft = await (await getJevLimits()).runsLeft(user);

  return (
    <div className="p-pad-2 max-w-2xl">
      <h1 className="text-2xl font-light text-my-espresso dark:text-my-cream mb-3">{project.title}</h1>
      <p className="text-my-walnut dark:text-my-stone text-sm leading-relaxed mb-pad-2">{project.description}</p>
      <OptionsPanel runsLeft={runsLeft} />
    </div>
  );
}
