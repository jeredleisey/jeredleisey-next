import { notFound } from 'next/navigation';
import { ReadingTransition } from '@/components/PageTransitions';
import { UpdateBody } from '@/components/life/UpdateBody';
import { getUpdate, getUpdates } from '@/lib/content';
// PROTOTYPE (reading pages): the variants and the switcher never go to main.
import { PrototypeSwitcher } from '@/components/PrototypeSwitcher';
import { VARIANTS, wordCount, type ReadingDoc } from '@/app/_prototype-reading/doc';
import { VariantA } from '@/app/_prototype-reading/VariantA';
import { VariantB } from '@/app/_prototype-reading/VariantB';
import { VariantC } from '@/app/_prototype-reading/VariantC';
import { formatDate } from '@/lib/format';

// Drafts show only while Jered runs the site in development. The build lists only
// published Updates, and a slug that is not listed is a 404, so a Draft gets no page.
const includeDrafts = process.env.NODE_ENV === 'development';

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ variant?: string }> };

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

export default async function UpdatePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const update = getUpdate(slug, { includeDrafts });
  if (!update) notFound();

  const raw = (await searchParams).variant;
  const variant = VARIANTS.some((v) => v.key === raw) ? raw! : 'A';
  if (variant !== '0') {
    const words = wordCount(update.content);
    const doc: ReadingDoc = {
      kind: 'update',
      kindLabel: 'Life',
      title: update.title,
      date: update.date,
      draft: update.draft,
      words,
      minutes: Math.max(1, Math.round(words / 230)),
      facets: [],
      body: <UpdateBody update={update} />,
    };
    const V = { A: VariantA, B: VariantB, C: VariantC }[variant as 'A' | 'B' | 'C'];
    return (
      <ReadingTransition>
        <>
          <V doc={doc} />
          <PrototypeSwitcher variants={VARIANTS} current={variant} />
        </>
      </ReadingTransition>
    );
  }

  return (
    <ReadingTransition>
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
    </ReadingTransition>
  );
}
