'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import jev from './my-name-is-jev.jpg';

// Clicks on "Jev" that are closer together than this count as one burst.
const BURST_MS = 600;
const CLICKS = 3;
const SHOW_MS = 6000;

// The Jev page title, with a small easter egg: three quick clicks on the word "Jev" show
// a still that says "My name is Jev." It closes on a click, on Esc, or after a few
// seconds, and it never covers the panel for long (#94).
export function JevTitle({ title, className }: { title: string; className: string }) {
  const [first, ...rest] = title.split(' ');
  const [shown, setShown] = useState(false);
  const burst = useRef({ count: 0, last: 0 });

  useEffect(() => {
    if (!shown) return;
    const hide = setTimeout(() => setShown(false), SHOW_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShown(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(hide);
      window.removeEventListener('keydown', onKey);
    };
  }, [shown]);

  function onNameClick(e: React.MouseEvent) {
    const b = burst.current;
    b.count = e.timeStamp - b.last < BURST_MS ? b.count + 1 : 1;
    b.last = e.timeStamp;
    if (b.count >= CLICKS) {
      b.count = 0;
      setShown(true);
    }
  }

  return (
    <>
      <h1 className={className}>
        <span onClick={onNameClick} className="cursor-default select-none">
          {first}
        </span>{' '}
        {rest.join(' ')}
      </h1>
      {shown && (
        <button
          type="button"
          onClick={() => setShown(false)}
          aria-label="Close"
          className="fixed bottom-6 left-6 z-[60] w-40 border-4 border-my-cream shadow-xl animate-[jev-egg_300ms_cubic-bezier(0.2,0,0,1)_both] motion-reduce:animate-none rotate-[-3deg]"
        >
          <Image src={jev} alt="My name is Jev." sizes="160px" className="block h-auto w-full" />
        </button>
      )}
    </>
  );
}
