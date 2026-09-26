import { notFound } from 'next/navigation';
import { UpdateBody } from '@/components/life/UpdateBody';
import { getUpdate, getUpdates } from '@/lib/content';
import { formatDate } from '@/lib/format';

// Drafts show only while Jered runs the site in development. The build lists only
// published Updates, and a slug that is not listed is a 404, so a Draft gets no page.
const includeDrafts = process.env.NODE_ENV === 'development';

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getUpdates({ includeDrafts }).map((update) => ({ slug: update.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const update = getUpdate(slug, { includeDrafts });
  if (!update) return {};
  const name = update.title ?? `Update of ${formatDate(update.date)}`;
  return { title: `${name} — Jered Leisey` };
}

export default async function UpdatePage({ params }: Props) {
  const { slug } = await params;
  const update = getUpdate(slug, { includeDrafts });
  if (!update) notFound();

  return (
    <div className="p-pad-2 max-w-2xl">
      <div className="mb-8">
        <p className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-3">
          {formatDate(update.date)}
          {update.draft && <span className="text-my-orange"> · Draft</span>}
        </p>
        {update.title ? (
          <h1 className="text-my-espresso dark:text-my-cream text-2xl font-light leading-snug">{update.title}</h1>
        ) : (
          // An Update often has no title. The page still needs a heading for screen readers.
          <h1 className="sr-only">Update of {formatDate(update.date)}</h1>
        )}
      </div>

      <UpdateBody update={update} />
    </div>
  );
}
