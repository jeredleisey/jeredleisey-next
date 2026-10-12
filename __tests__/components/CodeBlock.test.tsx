import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { within } from '@testing-library/react';
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
  return block.querySelector('[data-code-label]')?.textContent ?? '';
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

  it('shows the label as plain text, not as a control', async () => {
    const root = await mount(fence('sh'));
    const label = root.querySelector('[data-code-label]')!;
    expect(label.matches('button, a, [role], [tabindex]')).toBe(false);
  });

  it('names the Code Block by its label', async () => {
    const root = await mount(fence('sh'));
    const block = root.querySelector('[data-code-block]')!;
    const label = root.querySelector('[data-code-label]')!;
    expect(label.id).not.toBe('');
    expect(block.getAttribute('aria-labelledby')).toBe(label.id);
  });

  it('reads an uppercase fence word the same as a lowercase one', async () => {
    const root = await mount(fence('SH'));
    expect(labelOf(root.querySelector('[data-code-block]')!)).toBe('Shell');
  });

  it('does not put a Code Block around inline code', async () => {
    const root = await mount('Run `npm test` now.');
    expect(root.querySelector('[data-code-block]')).toBeNull();
    expect(root.querySelector('pre')).toBeNull();
    expect(root.querySelector('p code')?.textContent).toBe('npm test');
  });
  describe('highlight', () => {
    // The light color of each token span, by the text of the token.
    function lightColors(root: HTMLElement): Map<string, string> {
      const colors = new Map<string, string>();
      root.querySelectorAll('pre code span').forEach((el) => {
        const match = (el.getAttribute('style') ?? '').match(/--shiki-light:\s*(#[0-9a-f]{6})/i);
        if (match && el.children.length === 0) colors.set((el.textContent ?? '').trim(), match[1].toLowerCase());
      });
      return colors;
    }

    it.each(['python', 'Python'])('highlights a %s fence with its code text complete and in order', async (word) => {
      const code = ['# count', 'def total(items):', '    return "sum"', 'print(42)'].join('\n');
      const root = await mount(fence(word, code));
      expect(root.querySelector('pre code')?.textContent).toBe(code + '\n');
      const colors = lightColors(root);
      const comment = colors.get('# count');
      const keyword = colors.get('def');
      const string = colors.get('"sum"');
      expect(new Set([comment, keyword, string]).size).toBe(3);
      expect([comment, keyword, string]).not.toContain(undefined);
    });

    it('keeps an unquoted shell argument in the plain tone and a quoted string in a different tone', async () => {
      const root = await mount(fence('sh', 'npm install --save-dev "a b" && ls'));
      const colors = lightColors(root);
      expect(colors.get('install')).toBe(colors.get('npm'));
      expect(colors.get('--save-dev')).toBe(colors.get('npm'));
      expect(colors.get('"a b"')).not.toBe(colors.get('npm'));
      expect(colors.get('&&')).not.toBe(colors.get('npm'));
    });

    it('keeps the semicolon at the end of a TypeScript statement in the plain tone', async () => {
      const root = await mount(fence('ts', 'let value;'));
      const colors = lightColors(root);
      // Shiki joins neighbors of one color, so the semicolon may sit in the token of the name.
      const colorOf = (part: string) => [...colors].find(([text]) => text.includes(part))?.[1];
      expect(colorOf(';')).toBeDefined();
      expect(colorOf(';')).toBe(colorOf('value'));
    });

    it.each(['', 'text', 'txt'])('shows a fence with the language "%s" in the plain tone only', async (word) => {
      const root = await mount(fence(word, 'def total(items): return 42'));
      expect(lightColors(root).size).toBe(0);
      expect(root.querySelector('pre code')?.textContent).toBe('def total(items): return 42\n');
    });

    it('shows a fence with an unknown language as plain text, with its fence word as the label', async () => {
      const root = await mount(fence('klingon', 'def total(items): return 42'));
      expect(lightColors(root).size).toBe(0);
      expect(labelOf(root.querySelector('[data-code-block]')!)).toBe('klingon');
      expect(root.querySelector('pre code')?.textContent).toBe('def total(items): return 42\n');
    });
  });

  it('gives each Code Block a button named "Copy code"', async () => {
    const root = await mount([fence('sh'), '', fence('')].join('\n'));
    const blocks = root.querySelectorAll<HTMLElement>('[data-code-block]');
    expect(blocks).toHaveLength(2);
    for (const block of blocks) {
      expect(within(block).getByRole('button', { name: 'Copy code' })).toHaveAttribute('type', 'button');
    }
  });
});
