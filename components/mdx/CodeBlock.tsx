import { useId, type ComponentPropsWithoutRef } from 'react';
import { labelForLanguage } from './languages';
import { CopyButton } from './CopyButton';

type PreProps = ComponentPropsWithoutRef<'pre'> & { 'data-language'?: string };

// The body of a Code Block: the pre with the code inside. It is a separate component because
// a Code Group will use the same body in its tab panels.
export function CodeBody({ children }: Pick<PreProps, 'children'>) {
  return (
    <pre className="m-0 overflow-x-auto px-5 py-4 font-mono text-sm leading-relaxed text-my-espresso dark:text-my-cream">
      {children}
    </pre>
  );
}

// A framed piece of code: a header with the name of the language, and the body. not-prose
// stops every typography rule of the prose classes inside the frame.
// The header is a div and not a figcaption, so that a copy button or a tab list in it does not
// become part of the name of the figure. The label names the figure through aria-labelledby.
export function CodeBlock({ children, 'data-language': language }: PreProps) {
  const labelId = useId();
  return (
    <figure
      data-code-block
      aria-labelledby={labelId}
      className="not-prose my-6 overflow-hidden rounded-xl border border-my-stone/50 bg-my-parchment dark:border-my-stone/15 dark:bg-my-cream/[0.04]"
    >
      <div className="flex h-11 items-center border-b border-my-stone/50 px-5 font-sans text-[13px] text-my-walnut dark:border-my-stone/15 dark:text-my-stone">
        <span id={labelId} data-code-label>
          {labelForLanguage(language)}
        </span>
        <CopyButton />
      </div>
      <CodeBody>{children}</CodeBody>
    </figure>
  );
}
