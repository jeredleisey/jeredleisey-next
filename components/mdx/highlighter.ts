import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { LANGUAGES } from './languages';
import { darkTheme, lightTheme } from './codeThemes';

// One highlighter for the whole server process. It holds only the grammars of the label table.
let highlighter: Promise<HighlighterCore> | undefined;

export function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= createHighlighterCore({
    themes: [lightTheme, darkTheme],
    langs: [...new Map(LANGUAGES.flatMap(({ grammar }) => (grammar ? [[grammar.id, grammar.load()] as const] : []))).values()],
    engine: createJavaScriptRegexEngine(),
  });
  return highlighter;
}

export const THEMES = { light: lightTheme.name!, dark: darkTheme.name! };
