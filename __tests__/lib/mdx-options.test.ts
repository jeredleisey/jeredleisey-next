import { describe, it, expect } from 'vitest';
import { evaluate } from 'next-mdx-remote-client/rsc';
import { renderToStaticMarkup } from 'react-dom/server';
import { mdxOptions } from '@/lib/mdxOptions';

async function render(source: string): Promise<string> {
  const { content, error } = await evaluate({ source, options: mdxOptions });
  if (error) throw error;
  return renderToStaticMarkup(content);
}

describe('mdxOptions', () => {
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
});
