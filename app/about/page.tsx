import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote-client/rsc';
import { proseClasses } from '@/lib/proseClasses';

// The About page is one MDX file. The reader stays here because no other page uses it.
function readAbout() {
  const file = path.join(process.cwd(), 'content', 'about.mdx');
  const { data, content } = matter(fs.readFileSync(file, 'utf8'));
  if (typeof data.title !== 'string' || data.title.trim() === '') {
    throw new Error(`${file}: the frontmatter needs a "title".`);
  }
  return { title: data.title, content };
}

export function generateMetadata() {
  return { title: `${readAbout().title} — Jered Leisey` };
}

export default function AboutPage() {
  const about = readAbout();

  return (
    <div className="p-pad-2 max-w-2xl">
      <h1 className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-pad-2">{about.title}</h1>
      <div className={proseClasses}>
        <MDXRemote source={about.content} />
      </div>
    </div>
  );
}
