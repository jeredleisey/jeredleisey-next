'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

// The site name links home, so Home is not a section.
const NAV_ITEMS = [{ label: 'Projects', href: '/projects' }] as const;

export function GlobalNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="pb-pad-2 border-b border-my-stone/30 dark:border-my-espresso/30">
      <Link href="/" className="block text-my-espresso dark:text-my-cream text-sm font-light mb-pad-2 hover:text-my-orange transition-colors">
        Jered Leisey
      </Link>
      <nav aria-label="Site navigation" className="flex flex-col gap-2">
        {NAV_ITEMS.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? 'page' : undefined}
            className={`text-xs transition-colors duration-150 ${
              isActive(href)
                ? 'text-my-orange'
                : 'text-my-walnut hover:text-my-espresso dark:text-my-stone dark:hover:text-my-cream'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-3">
        <ThemeToggle />
      </div>
      <div className="mt-3">
        <UserMenu />
      </div>
    </div>
  );
}
