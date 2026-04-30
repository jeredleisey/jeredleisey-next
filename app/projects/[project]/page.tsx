import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getProject, getAllProjects } from '@/lib/content';
import { LessonRefs } from '@/components/LessonRefs';

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

      <div className="prose prose-sm max-w-none
        prose-headings:font-light prose-headings:text-my-espresso dark:prose-headings:text-my-cream
        prose-p:text-my-walnut dark:prose-p:text-my-stone prose-p:leading-relaxed
        prose-a:text-my-orange prose-a:no-underline hover:prose-a:text-my-espresso dark:hover:prose-a:text-my-cream
        prose-strong:text-my-espresso dark:prose-strong:text-my-cream prose-strong:font-normal
        prose-code:text-my-amber prose-code:bg-my-stone/20 dark:prose-code:bg-my-espresso/50 prose-code:px-1 prose-code:rounded
        prose-pre:bg-my-stone/20 dark:prose-pre:bg-my-espresso/50 prose-pre:border prose-pre:border-my-stone/30 dark:prose-pre:border-my-espresso/30">
        <MDXRemote source={project.content} />
      </div>

      <LessonRefs refs={project.lessonRefs} />
    </div>
  );
}
