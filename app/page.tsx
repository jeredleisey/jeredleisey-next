
export const metadata = { title: 'Jered Leisey' };

export default function HomePage() {
  return (
    <div className="h-full flex flex-col p-pad-2">
      <div className="mb-pad-2">
        <h1 className="text-3xl xl:text-5xl font-light text-my-espresso dark:text-my-cream leading-tight max-w-xl">
          Whatever I&apos;m into,{' '}
          <br />
          I&apos;m{' '}
          <em className="italic text-my-orange">all the way in.</em>
          <br />
          Let me show you.
        </h1>
      </div>

      <div className="mt-auto border-t border-my-stone/30 dark:border-my-espresso/30 pt-3 flex justify-between">
        <span className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest">Asheville, NC</span>
        <span className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest">Est. 2025</span>
      </div>
    </div>
  );
}
