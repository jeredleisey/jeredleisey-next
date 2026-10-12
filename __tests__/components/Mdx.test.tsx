import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderMdx } from '@/components/mdx/Mdx';

async function render(source: string): Promise<string> {
  return renderToStaticMarkup(await renderMdx(source));
}

describe('renderMdx', () => {
  it('renders a GFM table as a table element', async () => {
    const html = await render(['| Piece | State |', '| --- | --- |', '| Storage | 2 TB |'].join('\n'));
    expect(html).toContain('<table>');
    expect(html).toContain('<th>Piece</th>');
    expect(html).toContain('<td>2 TB</td>');
    expect(html).not.toContain('| --- |');
  });

  it('still renders block quotes and fenced code', async () => {
    const html = await render(['> A quote.', '', '```', 'a | b', '```'].join('\n'));
    expect(html).toContain('<blockquote>');
    expect(html).toContain('<pre><code>a | b');
  });

  it('puts the content in the reading prose styles', async () => {
    const html = await render('A paragraph.');
    expect(html).toMatch(/^<div class="prose [^"]*"><p>A paragraph\.<\/p><\/div>$/);
  });

  it('throws when the MDX does not compile', async () => {
    await expect(render('<Unclosed>')).rejects.toThrow();
  });
});
