import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote-client/rsc';
import type { Update } from '@/lib/content';
import { proseClasses } from '@/lib/proseClasses';

// The text, photos, and link of one Update. The Life list and the Update page both use it.
//
// Each photo takes its width and height from the frontmatter, so next/image can reserve
// the space before the file loads. CSS keeps the photo inside a column of at most 32rem
// and never scales it past its own size. The sizes value tells the browser the same,
// so it downloads a file no wider than it shows.
export function UpdateBody({ update }: { update: Update }) {
  return (
    <div className="flex flex-col gap-4">
      <div className={proseClasses}>
        <MDXRemote source={update.content} />
      </div>

      {update.photos.length > 0 && (
        <div className="flex flex-col gap-3 max-w-lg">
          {update.photos.map((photo) => (
            <Image
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              sizes="(max-width: 640px) 100vw, 32rem"
              className="h-auto max-w-full rounded-sm"
            />
          ))}
        </div>
      )}

      {update.link && (
        <p className="text-xs">
          <a
            href={update.link.url}
            className="text-my-orange hover:text-my-espresso dark:hover:text-my-cream transition-colors break-words"
          >
            {update.link.label ?? update.link.url}
          </a>
        </p>
      )}
    </div>
  );
}
