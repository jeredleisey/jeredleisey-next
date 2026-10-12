'use client';

import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { CopyButton } from './CopyButton';
import { FRAME_CLASSES, HEADER_CLASSES } from './codeFrame';

// The frame of a Code Group: a tab list in the header, the copy button, and one panel for each
// tab. The server renders every panel, and this component hides all of them but the selected
// one. The tab row scrolls sideways when it does not fit, and the copy button stays at the right.
// The only state is the index of the selected tab. The copy button reads the panel that
// is not hidden, so it needs nothing from this component.
export function CodeTabs({ labels, panels }: { labels: string[]; panels: ReactNode[] }) {
  const id = useId();
  const [selected, setSelected] = useState(0);
  const tabId = (i: number) => `${id}-tab-${i}`;
  const panelId = (i: number) => `${id}-panel-${i}`;

  // The tabs pattern of WAI-ARIA with automatic activation: an arrow key moves the focus and
  // the selection together, and wraps at the ends.
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const last = labels.length - 1;
    let target: number;
    switch (event.key) {
      case 'ArrowRight':
        target = selected === last ? 0 : selected + 1;
        break;
      case 'ArrowLeft':
        target = selected === 0 ? last : selected - 1;
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    setSelected(target);
    event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[target]?.focus();
  }

  return (
    <figure data-code-block aria-labelledby={tabId(selected)} className={FRAME_CLASSES}>
      <div className={HEADER_CLASSES}>
        <div
          role="tablist"
          aria-label="Languages"
          onKeyDown={onKeyDown}
          className="-ml-3 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {labels.map((label, i) => (
            <button
              key={label}
              type="button"
              role="tab"
              id={tabId(i)}
              aria-selected={i === selected}
              aria-controls={panelId(i)}
              tabIndex={i === selected ? 0 : -1}
              onClick={() => setSelected(i)}
              className={`h-8 shrink-0 cursor-pointer whitespace-nowrap rounded-lg px-3 transition-colors duration-200 motion-reduce:transition-none hover:text-my-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-my-orange/60 dark:hover:text-my-cream ${
                i === selected
                  ? 'bg-my-stone/30 text-my-espresso dark:bg-my-cream/10 dark:text-my-cream'
                  : 'text-my-walnut dark:text-my-stone'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <CopyButton />
      </div>
      {panels.map((panel, i) => (
        <div key={labels[i]} role="tabpanel" id={panelId(i)} aria-labelledby={tabId(i)} hidden={i !== selected}>
          {panel}
        </div>
      ))}
    </figure>
  );
}
