import { describe, it, expect, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { within } from '@testing-library/react';
import { renderMdx } from '@/components/mdx/Mdx';

// Seam 1: MDX source in, static HTML out. The static HTML goes into a DOM element so that the
// tests query it the way a Visitor reads it.
async function mount(source: string): Promise<HTMLElement> {
  const root = document.createElement('div');
  root.innerHTML = renderToStaticMarkup(await renderMdx(source));
  // The names of elements come from ids, so the root must be in the document.
  document.body.append(root);
  return root;
}

function fence(language: string, code: string): string {
  return ['```' + language, code, '```'].join('\n');
}

function group(...fences: string[]): string {
  return ['<CodeGroup>', '', fences.join('\n\n'), '', '</CodeGroup>'].join('\n');
}

afterEach(() => {
  document.body.replaceChildren();
});

const PY_AND_TS = group(fence('python', 'print("hi")'), fence('ts', 'console.log("hi")'));

describe('Code Group', () => {
  it('shows one tab list with one tab for each fence, named by its label', async () => {
    const root = await mount(PY_AND_TS);
    const list = within(root).getByRole('tablist');
    const tabs = within(list).getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Python', 'TypeScript']);
  });

  it('selects the first tab', async () => {
    const root = await mount(PY_AND_TS);
    const [first, second] = within(root).getAllByRole('tab');
    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(second).toHaveAttribute('aria-selected', 'false');
  });

  it('puts both panels in the HTML, shows the first, and hides the second', async () => {
    const root = await mount(PY_AND_TS);
    const [first, second] = root.querySelectorAll('[role="tabpanel"]');
    expect(first).not.toHaveAttribute('hidden');
    expect(second).toHaveAttribute('hidden');
  });

  it('puts the code of each language in its own panel, named by its tab', async () => {
    const root = await mount(PY_AND_TS);
    const panelOf = (name: string) =>
      document.getElementById(within(root).getByRole('tab', { name }).getAttribute('aria-controls')!)!;
    const python = panelOf('Python');
    const typescript = panelOf('TypeScript');
    expect(python).toHaveAttribute('role', 'tabpanel');
    expect(python).toHaveTextContent('print("hi")');
    expect(python).not.toHaveTextContent('console.log');
    expect(typescript).toHaveTextContent('console.log("hi")');
  });

  it('names the figure by the selected tab', async () => {
    const root = await mount(PY_AND_TS);
    expect(within(root).getByRole('figure', { name: 'Python' })).toBeInTheDocument();
  });

  it('labels each tab from the label table', async () => {
    const root = await mount(group(fence('sh', 'ls'), fence('yml', 'a: 1'), fence('', 'plain')));
    const tabs = within(root).getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Shell', 'YAML', 'Text']);
  });

  it('throws an error that names the label when two fences have the same label', async () => {
    await expect(mount(group(fence('sh', 'ls'), fence('zsh', 'pwd')))).rejects.toThrow(/"Shell"/);
  });

  it('throws when the group holds one fence', async () => {
    await expect(mount(group(fence('sh', 'ls')))).rejects.toThrow(/at least two/);
  });

  it('throws when the group holds something that is not a code fence', async () => {
    const source = group(fence('sh', 'ls'), 'Some text.', fence('python', 'pass'));
    await expect(mount(source)).rejects.toThrow(/only code fences/);
  });

  it('gives a Code Block outside a group a label and no tab list', async () => {
    const root = await mount(fence('sh', 'ls'));
    expect(within(root).queryByRole('tablist')).toBeNull();
    expect(root.querySelector('[data-code-label]')?.textContent).toBe('Shell');
  });
});
