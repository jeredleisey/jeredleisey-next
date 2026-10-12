'use client';

import { useEffect, useRef, useState } from 'react';

// How long the check mark shows after a copy.
const COPIED_MS = 2000;

// The text of the code that shows in a Code Block: the first body that is not hidden. A Code
// Group holds one body for each tab, and only the selected one is not hidden.
function visibleCode(from: Element): string | null {
  const bodies =
    from.closest('[data-code-block]')?.querySelectorAll('pre') ?? [];
  for (const pre of bodies) {
    if (!pre.closest('[hidden]')) return pre.textContent;
  }
  return null;
}

const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

// The button copies the code that shows in its Code Block. It reads the code from the page at
// click time, so the server sends no second copy of it.
export function CopyButton() {
  const ref = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    const code = ref.current ? visibleCode(ref.current) : null;
    if (code === null) return;
    try {
      await navigator.clipboard.writeText(code.replace(/\n$/, ''));
    } catch {
      // The write can fail, and the clipboard is missing on a page that is not secure.
      // The button then shows no success state.
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  }

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label="Copy code"
        onClick={copy}
        className={`-mr-3 ml-auto flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors duration-200 motion-reduce:transition-none hover:text-my-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-my-orange/60 dark:hover:text-my-cream ${
          copied
            ? 'text-my-espresso dark:text-my-cream'
            : 'text-my-walnut dark:text-my-stone'
        }`}
      >
        {copied ? (
          <svg {...iconProps}>
            <path d="M3 8.5l3.5 3.5L13 4.5" />
          </svg>
        ) : (
          <svg {...iconProps}>
            <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
            <path d="M10.5 5.5v-2a1.5 1.5 0 0 0-1.5-1.5H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5h2" />
          </svg>
        )}
      </button>
      <span role="status" className="sr-only">
        {copied ? 'Copied' : ''}
      </span>
    </>
  );
}
