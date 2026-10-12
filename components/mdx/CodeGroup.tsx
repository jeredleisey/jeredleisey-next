import { Children, isValidElement, type ReactNode } from 'react';
import { CodeBlock, CodeBody } from './CodeBlock';
import { CodeTabs } from './CodeTabs';
import { labelForLanguage } from './languages';

// A set of code fences in one frame, with one tab for each language. MDX gives each fence to
// this component as a CodeBlock element, with the fence language in data-language and the
// code element as children. This component reads those props and does not render the
// CodeBlock, so that the group has one frame and not one for each fence.
// An error here fails the build. A broken tab row is worse than no page.
export function CodeGroup({ children }: { children?: ReactNode }) {
  const labels: string[] = [];
  const panels: ReactNode[] = [];
  for (const child of Children.toArray(children)) {
    // The blank lines in the MDX source can leave whitespace text between the fences.
    if (typeof child === 'string' && child.trim() === '') continue;
    if (!isValidElement<{ 'data-language'?: string; children?: ReactNode }>(child) || child.type !== CodeBlock) {
      throw new Error('A Code Group holds only code fences. Remove everything else from the CodeGroup tag.');
    }
    const label = labelForLanguage(child.props['data-language']);
    if (labels.includes(label)) {
      throw new Error(`A Code Group has two fences with the label "${label}". Each fence needs its own language.`);
    }
    labels.push(label);
    panels.push(<CodeBody key={label}>{child.props.children}</CodeBody>);
  }
  if (labels.length < 2) {
    throw new Error('A Code Group needs at least two code fences. Use a plain code fence for one language.');
  }
  return <CodeTabs labels={labels} panels={panels} />;
}
