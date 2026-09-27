import { FeedList } from '@/components/home/FeedList';
import { HomeTransition } from '@/components/PageTransitions';
import { getFeed, splitFeed } from '@/lib/content';

export const metadata = { title: 'Jered Leisey' };

const FEED_LENGTH = 12;

// The sentence, and the feed. From 768px the feed is the panel in the root layout,
// open on this page. On a phone it runs under the sentence. The design comes from
// #57, #77, and #78.
export default function HomePage() {
  const feed = splitFeed(getFeed({ includeDrafts: process.env.NODE_ENV === 'development', limit: FEED_LENGTH }));

  return (
    <HomeTransition>
      <div className="px-pad-2 py-pad-4">
        {/* Placeholder: Jered writes the real sentence. */}
        <p className="font-serif font-light text-4xl xl:text-5xl leading-[1.1] text-my-espresso dark:text-my-cream max-w-md">
          Jered Leisey. Software and automation.
        </p>
        <p className="mt-6 text-xs text-my-walnut dark:text-my-stone">Latest work and life, newest first.</p>

        <div className="mt-pad-4 md:hidden">
          <FeedList feed={feed} />
        </div>
      </div>
    </HomeTransition>
  );
}
