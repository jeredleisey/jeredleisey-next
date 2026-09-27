import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote-client/rsc';
import { proseClasses } from '@/lib/proseClasses';

// The privacy page is one MDX file, read the same way as the About page. Google links to it
// from the sign-in consent screen.
function readPrivacy() {
  const file = path.join(process.cwd(), 'content', 'privacy.mdx');
  const { data, content } = matter(fs.readFileSync(file, 'utf8'));
  if (typeof data.title !== 'string' || data.title.trim() === '') {
    throw new Error(`${file}: the frontmatter needs a "title".`);
  }
  return { title: data.title, content };
}

export function generateMetadata() {
  return { title: `${readPrivacy().title} — Jered Leisey` };
}

export default function PrivacyPage() {
  const privacy = readPrivacy();

  return (
    <div className="p-pad-2 max-w-2xl">
      <h1 className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-pad-2">{privacy.title}</h1>
      <div className={proseClasses}>
        <MDXRemote source={privacy.content} />
      </div>
    </div>
  );
}
