'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Learn', href: '/learn' },
  { label: 'Projects', href: '/projects' },
  { label: 'Writing', href: '/writing' },
] as const;

export function GlobalNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <div className="pb-pad-2 border-b border-my-espresso/30">
      <p className="text-my-cream text-sm font-light mb-pad-2">Jered Leisey</p>
      <nav aria-label="Site navigation" className="flex flex-col gap-2">
        {NAV_ITEMS.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? 'page' : undefined}
            className={`text-xs transition-colors duration-150 ${
              isActive(href) ? 'text-my-orange' : 'text-my-stone hover:text-my-cream'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
