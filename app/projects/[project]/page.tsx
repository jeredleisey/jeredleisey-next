import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getProject, getAllProjects } from '@/lib/content';
import { LessonRefs } from '@/components/LessonRefs';
import { proseClasses } from '@/lib/proseClasses';

export async function generateStaticParams() {
  return getAllProjects().map((p) => ({ project: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ project: string }> }) {
  const { project: projectSlug } = await params;
  const project = getProject(projectSlug);
  if (!project) return {};
  return {
    title: `${project.metadata.title} — Jered Leisey`,
    description: project.metadata.description,
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ project: string }> }) {
  const { project: projectSlug } = await params;
  const project = getProject(projectSlug);
  if (!project) notFound();

  return (
    <div className="p-pad-2 max-w-2xl">
      <div className="mb-8">
        <p className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-3">Project</p>
        <h1 className="text-my-espresso dark:text-my-cream text-2xl font-light leading-snug">
          {project.metadata.title}
        </h1>
        <p className="text-my-walnut dark:text-my-stone text-sm mt-3 leading-relaxed">
          {project.metadata.description}
        </p>
      </div>

      <div className={proseClasses}>
        <MDXRemote source={project.content} />
      </div>

      <LessonRefs refs={project.lessonRefs} />
    </div>
  );
}
