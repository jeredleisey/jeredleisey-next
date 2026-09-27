import { notFound } from 'next/navigation';
import { ReadingTransition } from '@/components/PageTransitions';
import { UpdateBody } from '@/components/life/UpdateBody';
import { ReadingLayout } from '@/components/reading/ReadingLayout';
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
    <ReadingTransition>
      <ReadingLayout kindLabel="Life" slug={update.slug} date={update.date} draft={update.draft} title={update.title}>
        <UpdateBody update={update} />
      </ReadingLayout>
    </ReadingTransition>
  );
}
