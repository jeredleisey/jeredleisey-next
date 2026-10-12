import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderMdx } from '@/components/mdx/Mdx';

// Seam 1: MDX source in, static HTML out. The static HTML goes into a DOM element so that the
// tests query it the way a Visitor reads it.
async function mount(source: string): Promise<HTMLElement> {
  const root = document.createElement('div');
  root.innerHTML = renderToStaticMarkup(await renderMdx(source));
  return root;
}

function fence(language: string, code = 'echo hi'): string {
  return ['```' + language, code, '```'].join('\n');
}

function labelOf(block: Element): string {
  return block.querySelector('figcaption')?.textContent ?? '';
}

describe('Code Block', () => {
  it('labels a fence with no language as Text', async () => {
    const root = await mount(fence(''));
    const blocks = root.querySelectorAll('[data-code-block]');
    expect(blocks).toHaveLength(1);
    expect(labelOf(blocks[0])).toBe('Text');
  });

  it('labels an sh fence as Shell', async () => {
    const root = await mount(fence('sh'));
    expect(labelOf(root.querySelector('[data-code-block]')!)).toBe('Shell');
  });

  it.each([
    ['txt', 'Text'],
    ['text', 'Text'],
    ['zsh', 'Shell'],
    ['shell', 'Shell'],
    ['yml', 'YAML'],
    ['yaml', 'YAML'],
    ['py', 'Python'],
    ['python', 'Python'],
    ['js', 'JavaScript'],
    ['javascript', 'JavaScript'],
    ['ts', 'TypeScript'],
    ['typescript', 'TypeScript'],
    ['json', 'JSON'],
  ])('labels a %s fence as %s', async (word, label) => {
    const root = await mount(fence(word));
    expect(labelOf(root.querySelector('[data-code-block]')!)).toBe(label);
  });

  it('shows an unknown language as plain text with the fence word as the label', async () => {
    const root = await mount(fence('klingon', 'qapla'));
    const block = root.querySelector('[data-code-block]')!;
    expect(labelOf(block)).toBe('klingon');
    expect(block.querySelector('pre')?.textContent).toBe('qapla\n');
  });

  it('keeps the code complete with its line breaks and spaces', async () => {
    const code = ['if x:', '    print("a  b")', '', '  # end'].join('\n');
    const root = await mount(fence('python', code));
    expect(root.querySelector('pre')?.textContent).toBe(code + '\n');
  });

  it('keeps the label out of the focus order', async () => {
    const root = await mount(fence('sh'));
    expect(root.querySelector('[data-code-block] [tabindex], [data-code-block] button, [data-code-block] a')).toBeNull();
  });

  it('does not put a Code Block around inline code', async () => {
    const root = await mount('Run `npm test` now.');
    expect(root.querySelector('[data-code-block]')).toBeNull();
    expect(root.querySelector('pre')).toBeNull();
    expect(root.querySelector('p code')?.textContent).toBe('npm test');
  });
});
