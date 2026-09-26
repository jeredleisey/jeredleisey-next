import Link from 'next/link';
import { AdminNav } from './AdminNav';
import { adminPageAccess } from './guard';
import { label, muted, row } from './styles';

export const metadata = { title: 'Admin — Jered Leisey' };

const PAGES = [
  {
    href: '/admin/requests',
    title: 'Access Requests',
    description: 'Approve or decline requests for access to a Project.',
  },
  {
    href: '/admin/users',
    title: 'Users',
    description: 'See who has signed in, and assign or remove their Roles.',
  },
  {
    href: '/admin/roles',
    title: 'Roles',
    description: 'Create, rename, and delete Roles, and choose the Projects each Role opens.',
  },
];

export default async function AdminPage() {
  await adminPageAccess('/admin');

  return (
    <div className="p-pad-2 max-w-2xl">
      <AdminNav />
      <h1 className={`${label} mb-pad-2`}>Admin</h1>
      <ul>
        {PAGES.map((page) => (
          <li key={page.href} className={row}>
            <Link href={page.href} className="group block">
              <span className="text-my-espresso dark:text-my-cream text-sm group-hover:text-my-orange transition-colors">
                {page.title}
              </span>
              <p className={`${muted} mt-1`}>{page.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
