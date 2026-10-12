import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CodeBlock } from '@/components/mdx/CodeBlock';

// Seam 2: the Code Block component in jsdom. jsdom has no clipboard, so each test defines one.
const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

function mockClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
}

function clickCopy() {
  fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
}

describe('Copy button', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    if (original) Object.defineProperty(navigator, 'clipboard', original);
    else Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('writes the exact code to the clipboard, with no label and no trailing newline', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    render(
      <CodeBlock data-language="sh">
        <code>{'echo one\n\n\tindented  \necho two\n'}</code>
      </CodeBlock>
    );
    clickCopy();
    await act(async () => {});
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(
      'echo one\n\n\tindented  \necho two'
    );
  });

  it('copies the text of nested token spans', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    render(
      <CodeBlock data-language="python">
        <code>
          <span className="line">
            <span style={{ color: '#a00' }}>def</span>
            <span> total</span>
            <span>():</span>
          </span>
          {'\n'}
          <span className="line">
            <span>{'    return 42'}</span>
          </span>
          {'\n'}
        </code>
      </CodeBlock>
    );
    clickCopy();
    await act(async () => {});
    expect(writeText).toHaveBeenCalledWith('def total():\n    return 42');
  });

  it('says "Copied" after a copy and is empty again after the delay', async () => {
    vi.useFakeTimers();
    mockClipboard(vi.fn().mockResolvedValue(undefined));
    render(
      <CodeBlock>
        <code>{'echo hi\n'}</code>
      </CodeBlock>
    );
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('');
    clickCopy();
    await act(async () => {});
    expect(status).toHaveTextContent('Copied');
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(status).toHaveTextContent('');
  });

  it('shows no "Copied" state and throws no error when the write is rejected', async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    render(
      <CodeBlock>
        <code>{'echo hi\n'}</code>
      </CodeBlock>
    );
    clickCopy();
    await act(async () => {});
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('shows no "Copied" state and throws no error when there is no clipboard', async () => {
    Reflect.deleteProperty(navigator, 'clipboard');
    render(
      <CodeBlock>
        <code>{'echo hi\n'}</code>
      </CodeBlock>
    );
    clickCopy();
    await act(async () => {});
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('starts the delay again on a second click', async () => {
    vi.useFakeTimers();
    mockClipboard(vi.fn().mockResolvedValue(undefined));
    render(
      <CodeBlock>
        <code>{'echo hi\n'}</code>
      </CodeBlock>
    );
    const status = screen.getByRole('status');
    clickCopy();
    await act(async () => {});
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    clickCopy();
    await act(async () => {});
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(status).toHaveTextContent('Copied');
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(status).toHaveTextContent('');
  });

  it('copies the body that is not hidden when the container holds two bodies', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    const { container } = render(
      <CodeBlock>
        <code>{'echo first\n'}</code>
      </CodeBlock>
    );
    // A Code Group holds one body for each tab. This stands in for it: the first body is hidden.
    const figure = container.querySelector('[data-code-block]')!;
    const first = figure.querySelector('pre')!;
    const wrapper = document.createElement('div');
    wrapper.hidden = true;
    first.replaceWith(wrapper);
    wrapper.append(first);
    const second = first.cloneNode(true) as HTMLElement;
    second.querySelector('code')!.textContent = 'echo second\n';
    figure.append(second);
    clickCopy();
    await act(async () => {});
    expect(writeText).toHaveBeenCalledWith('echo second');
  });
});
