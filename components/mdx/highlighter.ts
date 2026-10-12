import { createHighlighterCore, type HighlighterCore, type LanguageRegistration } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { LANGUAGES, type GrammarId } from './languages';
import { DARK_THEME_NAME, LIGHT_THEME_NAME, darkTheme, lightTheme } from './codeThemes';

// The loader of each grammar. The id comes from the label table. The type makes a missing
// loader a compile error. Only server code imports this file, so no grammar reaches the browser.
const LOADERS: Record<GrammarId, () => Promise<{ default: LanguageRegistration[] }>> = {
  shellscript: () => import('shiki/langs/shellscript.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  yaml: () => import('shiki/langs/yaml.mjs'),
  python: () => import('shiki/langs/python.mjs'),
  sql: () => import('shiki/langs/sql.mjs'),
  nginx: () => import('shiki/langs/nginx.mjs'),
  javascript: () => import('shiki/langs/javascript.mjs'),
  typescript: () => import('shiki/langs/typescript.mjs'),
  jsx: () => import('shiki/langs/jsx.mjs'),
  tsx: () => import('shiki/langs/tsx.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  css: () => import('shiki/langs/css.mjs'),
  diff: () => import('shiki/langs/diff.mjs'),
};

// One highlighter for the whole server process. It holds only the grammars of the label table.
// A failed start clears the cache, so the next call tries again. The error still reaches the
// caller, so a failed highlight fails the render and the build.
let highlighter: Promise<HighlighterCore> | undefined;

export function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighter) {
    const ids = new Set(LANGUAGES.flatMap(({ grammar }) => (grammar ? [grammar] : [])));
    const started = createHighlighterCore({
      themes: [lightTheme, darkTheme],
      langs: [...ids].map((id) => LOADERS[id]()),
      engine: createJavaScriptRegexEngine(),
    });
    started.catch(() => {
      if (highlighter === started) highlighter = undefined;
    });
    highlighter = started;
  }
  return highlighter;
}

export const THEMES = { light: LIGHT_THEME_NAME, dark: DARK_THEME_NAME };
