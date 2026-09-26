'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAccess, getSessionUser } from '@/lib/access/server';
import { getProject } from '@/lib/projects';

// Sends an Access Request for the signed-in User. The User comes from the
// session, never from the form. The page binds the Project slug.
export async function requestAccessAction(projectSlug: string, formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect(`/sign-in?next=/projects/${encodeURIComponent(projectSlug)}`);

  const project = getProject(projectSlug);
  if (!project?.protected) throw new Error('No protected Project has that name.');

  const note = formData.get('note');
  const access = await getAccess();
  await access.requestAccess(user, project.slug, typeof note === 'string' ? note : undefined);
  // A refused request needs no message. The page shows the current state.
  revalidatePath(`/projects/${project.slug}`);
}
