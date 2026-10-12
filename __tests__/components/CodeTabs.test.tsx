import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { renderMdx } from '@/components/mdx/Mdx';

// Seam 2: the Code Group in jsdom. The tests render real MDX, so the tree is the one that the
// site sends: the server components have run, and the client component is interactive.
const SOURCE = [
  '<CodeGroup>',
  '',
  '```python',
  'print("py")',
  '```',
  '',
  '```ts',
  'console.log("ts")',
  '```',
  '',
  '```sh',
  'echo sh',
  '```',
  '',
  '</CodeGroup>',
].join('\n');

async function renderGroup() {
  render(await renderMdx(SOURCE));
  return screen.getAllByRole('tab');
}

describe('Code Group tabs', () => {
  it('selects the second tab on a click, shows its panel, and hides the first', async () => {
    const [python, typescript] = await renderGroup();
    fireEvent.click(typescript);
    expect(typescript).toHaveAttribute('aria-selected', 'true');
    expect(python).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('console.log("ts")');
    expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(3);
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
  });

  it('moves the selection and the focus with the right arrow key, and wraps at the end', async () => {
    const [python, typescript, shell] = await renderGroup();
    python.focus();
    fireEvent.keyDown(python, { key: 'ArrowRight' });
    expect(typescript).toHaveAttribute('aria-selected', 'true');
    expect(typescript).toHaveFocus();
    fireEvent.keyDown(typescript, { key: 'ArrowRight' });
    expect(shell).toHaveFocus();
    fireEvent.keyDown(shell, { key: 'ArrowRight' });
    expect(python).toHaveAttribute('aria-selected', 'true');
    expect(python).toHaveFocus();
  });

  it('moves the selection and the focus with the left arrow key, and wraps at the start', async () => {
    const [python, typescript, shell] = await renderGroup();
    python.focus();
    fireEvent.keyDown(python, { key: 'ArrowLeft' });
    expect(shell).toHaveAttribute('aria-selected', 'true');
    expect(shell).toHaveFocus();
    fireEvent.keyDown(shell, { key: 'ArrowLeft' });
    expect(typescript).toHaveFocus();
  });

  it('goes to the first tab with Home and to the last tab with End', async () => {
    const [python, typescript, shell] = await renderGroup();
    typescript.focus();
    fireEvent.click(typescript);
    fireEvent.keyDown(typescript, { key: 'End' });
    expect(shell).toHaveAttribute('aria-selected', 'true');
    expect(shell).toHaveFocus();
    fireEvent.keyDown(shell, { key: 'Home' });
    expect(python).toHaveAttribute('aria-selected', 'true');
    expect(python).toHaveFocus();
  });

  it('keeps only the selected tab in the tab order', async () => {
    const [python, typescript, shell] = await renderGroup();
    expect(python).toHaveAttribute('tabindex', '0');
    expect(typescript).toHaveAttribute('tabindex', '-1');
    fireEvent.click(shell);
    expect(shell).toHaveAttribute('tabindex', '0');
    expect(python).toHaveAttribute('tabindex', '-1');
  });

  it('leaves a key with a modifier alone, so that browser shortcuts still work', async () => {
    const [python] = await renderGroup();
    python.focus();
    const presses = [
      { key: 'ArrowRight', metaKey: true },
      { key: 'ArrowLeft', altKey: true },
      { key: 'Home', ctrlKey: true },
      { key: 'End', shiftKey: true },
    ];
    for (const press of presses) {
      const notCanceled = fireEvent.keyDown(python, press);
      expect(notCanceled).toBe(true);
      expect(python).toHaveAttribute('aria-selected', 'true');
    }
    expect(python).toHaveFocus();
  });

  it('leaves other keys alone', async () => {
    const [python] = await renderGroup();
    const notCanceled = fireEvent.keyDown(python, { key: 'a' });
    expect(notCanceled).toBe(true);
    expect(python).toHaveAttribute('aria-selected', 'true');
  });
});

describe('Code Group copy button', () => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

  afterEach(() => {
    if (original) Object.defineProperty(navigator, 'clipboard', original);
    else Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('copies the code of the selected tab only', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const [, , shell] = await renderGroup();
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
    await act(async () => {});
    expect(writeText).toHaveBeenLastCalledWith('print("py")');
    fireEvent.click(shell);
    // A tab change makes a new copy button, so the test finds it again.
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
    await act(async () => {});
    expect(writeText).toHaveBeenLastCalledWith('echo sh');
    expect(writeText).toHaveBeenCalledTimes(2);
  });

  it('resets to "Copy code" with no "Copied" status when the tab changes, and keeps the focus on the tab', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    const [python, typescript] = await renderGroup();
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
    await act(async () => {});
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
    typescript.focus();
    fireEvent.click(typescript);
    expect(screen.getByRole('status')).toHaveTextContent('');
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeInTheDocument();
    expect(typescript).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
    await act(async () => {});
    fireEvent.keyDown(typescript, { key: 'ArrowLeft' });
    expect(screen.getByRole('status')).toHaveTextContent('');
    expect(python).toHaveFocus();
  });

  it('is not one of the tabs', async () => {
    await renderGroup();
    const copy = screen.getByRole('button', { name: 'Copy code' });
    expect(copy.closest('[role="tablist"]')).toBeNull();
  });
});
