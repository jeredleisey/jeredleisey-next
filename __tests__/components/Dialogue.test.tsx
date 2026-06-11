import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Turn } from '@/components/Dialogue/Turn';
import { Note } from '@/components/Dialogue/Note';

describe('Turn', () => {
  it('renders the speaker label and body', () => {
    render(<Turn who="Jered"><p>Hello there.</p></Turn>);
    expect(screen.getByText('Jered')).toBeInTheDocument();
    expect(screen.getByText('Hello there.')).toBeInTheDocument();
  });

  it('accents a non-human speaker in orange', () => {
    render(<Turn who="Fable"><p>x</p></Turn>);
    expect(screen.getByText('Fable')).toHaveClass('text-my-orange');
  });

  it('does not accent the human speaker', () => {
    render(<Turn who="Jered"><p>x</p></Turn>);
    expect(screen.getByText('Jered')).not.toHaveClass('text-my-orange');
  });

  it('renders a nested Note', () => {
    render(
      <Turn who="Fable">
        <p>body text</p>
        <Note>a margin note</Note>
      </Turn>,
    );
    expect(screen.getByText('a margin note')).toBeInTheDocument();
    expect(screen.getByText('body text')).toBeInTheDocument();
  });
});
