import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { themeScript } from '@/lib/theme';

function runScript() {
  new Function(themeScript)();
}

function mockPrefersDark(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches, media: query }));
}

describe('themeScript', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('applies a saved dark preference', () => {
    mockPrefersDark(false);
    localStorage.setItem('theme', 'dark');
    runScript();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('lets a saved light preference win over a dark system preference', () => {
    mockPrefersDark(true);
    localStorage.setItem('theme', 'light');
    runScript();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('falls back to the system preference when nothing is saved', () => {
    mockPrefersDark(true);
    runScript();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('ignores an unknown saved value', () => {
    mockPrefersDark(false);
    localStorage.setItem('theme', 'purple');
    runScript();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
