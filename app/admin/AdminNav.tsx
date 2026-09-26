import Link from 'next/link';

const SECTIONS = [
  { href: '/admin/requests', title: 'Requests' },
  { href: '/admin/users', title: 'Users' },
  { href: '/admin/roles', title: 'Roles' },
] as const;

export type AdminSection = (typeof SECTIONS)[number]['href'];

// The links between the admin pages. The current page shows in orange.
export function AdminNav({ current }: { current?: AdminSection }) {
  return (
    <nav aria-label="Admin" className="flex flex-wrap items-baseline gap-6 mb-pad-2">
      <Link
        href="/admin"
        className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest hover:text-my-orange transition-colors"
      >
        Admin
      </Link>
      {SECTIONS.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          aria-current={section.href === current ? 'page' : undefined}
          className={`text-xs uppercase tracking-widest transition-colors hover:text-my-orange ${
            section.href === current
              ? 'text-my-orange'
              : 'text-my-espresso dark:text-my-cream'
          }`}
        >
          {section.title}
        </Link>
      ))}
    </nav>
  );
}
