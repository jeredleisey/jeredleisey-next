import Link from 'next/link';
import { PROJECTS } from '@/lib/projects';

export const metadata = { title: 'Projects — Jered Leisey' };

export default function ProjectsPage() {
  return (
    <div className="p-pad-2 max-w-lg">
      <h1 className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-pad-2">Projects</h1>

      <ul className="flex flex-col gap-0">
        {PROJECTS.map((project) => (
          <li key={project.slug} className="border-b border-my-stone/30 dark:border-my-espresso/30 last:border-0">
            <Link href={`/projects/${project.slug}`} className="group flex flex-col gap-1 py-5">
              <span className="text-my-espresso dark:text-my-cream text-sm group-hover:text-my-orange transition-colors">
                {project.title}
              </span>
              <span className="text-my-walnut dark:text-my-stone text-xs leading-relaxed">
                {project.description}
              </span>
              {project.protected && (
                <span className="text-my-walnut/60 dark:text-my-stone/60 text-xs uppercase tracking-widest">
                  Sign-in and access needed
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
