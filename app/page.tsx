import { HomeTransition } from './_prototype-transition/Transitions';

export const metadata = { title: 'Jered Leisey' };

// PROTOTYPE (feed panel): the feed lives in the root layout as a panel, docked open on this page.
// The design comes from "How should the home page look?" (#57).
export default function HomePage() {
  return (
    <HomeTransition>
      <div className="px-pad-2 py-pad-4">
        {/* Placeholder: Jered writes the real sentence. */}
        <p className="font-serif font-light text-4xl xl:text-5xl leading-[1.1] text-my-espresso dark:text-my-cream max-w-md">
          Jered Leisey. Software and automation.
        </p>
        <p className="mt-6 text-xs text-my-walnut dark:text-my-stone">Latest work and life, newest first.</p>
      </div>
    </HomeTransition>
  );
}
