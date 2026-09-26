// The site's Projects: interactive software that people use on the site.
// A protected Project needs a Permission, which is its slug.
export interface Project {
  slug: string;
  title: string;
  description: string;
  protected: boolean;
  // Name of the Role that holds this Project's Permission by default.
  defaultRoleName: string;
  // When the Project went live, as YYYY-MM-DD. It places the Project in the home feed.
  date: string;
}

export const PROJECTS: readonly Project[] = [
  {
    slug: 'jev',
    title: 'Jev prompt tester',
    description:
      'Try prompts against the Jev decision model from TypeSafe AI, with your own questions and criteria.',
    protected: true,
    defaultRoleName: 'Jev testers',
    date: '2026-09-26',
  },
];

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
