import type { LanguageRegistration } from 'shiki/core';

type Grammar = { id: string; load: () => Promise<{ default: LanguageRegistration[] }> };

// The label table of the Code Block. One row for each label, with the fence words that give
// it and the grammar for the highlight. A row with no grammar stays plain text. A new language
// is one new row.
export const LANGUAGES: { label: string; words: string[]; grammar?: Grammar }[] = [
  { label: 'Text', words: ['text', 'txt'] },
  { label: 'Shell', words: ['sh', 'shell', 'zsh'], grammar: { id: 'shellscript', load: () => import('shiki/langs/shellscript.mjs') } },
  { label: 'Bash', words: ['bash'], grammar: { id: 'shellscript', load: () => import('shiki/langs/shellscript.mjs') } },
  { label: 'JSON', words: ['json'], grammar: { id: 'json', load: () => import('shiki/langs/json.mjs') } },
  { label: 'YAML', words: ['yaml', 'yml'], grammar: { id: 'yaml', load: () => import('shiki/langs/yaml.mjs') } },
  { label: 'Python', words: ['python', 'py'], grammar: { id: 'python', load: () => import('shiki/langs/python.mjs') } },
  { label: 'SQL', words: ['sql'], grammar: { id: 'sql', load: () => import('shiki/langs/sql.mjs') } },
  { label: 'Nginx', words: ['nginx'], grammar: { id: 'nginx', load: () => import('shiki/langs/nginx.mjs') } },
  { label: 'JavaScript', words: ['js', 'javascript'], grammar: { id: 'javascript', load: () => import('shiki/langs/javascript.mjs') } },
  { label: 'TypeScript', words: ['ts', 'typescript'], grammar: { id: 'typescript', load: () => import('shiki/langs/typescript.mjs') } },
  { label: 'JSX', words: ['jsx'], grammar: { id: 'jsx', load: () => import('shiki/langs/jsx.mjs') } },
  { label: 'TSX', words: ['tsx'], grammar: { id: 'tsx', load: () => import('shiki/langs/tsx.mjs') } },
  { label: 'HTML', words: ['html'], grammar: { id: 'html', load: () => import('shiki/langs/html.mjs') } },
  { label: 'CSS', words: ['css'], grammar: { id: 'css', load: () => import('shiki/langs/css.mjs') } },
  { label: 'Diff', words: ['diff'], grammar: { id: 'diff', load: () => import('shiki/langs/diff.mjs') } },
];

const ROW_BY_WORD = new Map(LANGUAGES.flatMap((row) => row.words.map((word) => [word, row] as const)));

// The label for the language word of a fence. No word gives Text. A word that is not in the
// table gives itself, as the author wrote it.
export function labelForLanguage(language: string | undefined): string {
  if (!language) return 'Text';
  return ROW_BY_WORD.get(language.toLowerCase())?.label ?? language;
}

// The grammar for the language word of a fence. No grammar means plain text.
export function grammarForLanguage(language: string | undefined): Grammar | undefined {
  return language ? ROW_BY_WORD.get(language.toLowerCase())?.grammar : undefined;
}
