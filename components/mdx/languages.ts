// The label table of the Code Block. One row for each label, with the fence words that give
// it and the id of its grammar for the highlight. A row with no grammar stays plain text.
// A new language is one new row here, and one loader of the same id in highlighter.ts. The
// loaders are not here, so that a client component can import this file with no cost.
export type GrammarId =
  | 'shellscript' | 'json' | 'yaml' | 'python' | 'sql' | 'nginx'
  | 'javascript' | 'typescript' | 'jsx' | 'tsx' | 'html' | 'css' | 'diff';

export const LANGUAGES: { label: string; words: string[]; grammar?: GrammarId }[] = [
  { label: 'Text', words: ['text', 'txt'] },
  { label: 'Shell', words: ['sh', 'shell', 'zsh'], grammar: 'shellscript' },
  { label: 'Bash', words: ['bash'], grammar: 'shellscript' },
  { label: 'JSON', words: ['json'], grammar: 'json' },
  { label: 'YAML', words: ['yaml', 'yml'], grammar: 'yaml' },
  { label: 'Python', words: ['python', 'py'], grammar: 'python' },
  { label: 'SQL', words: ['sql'], grammar: 'sql' },
  { label: 'Nginx', words: ['nginx'], grammar: 'nginx' },
  { label: 'JavaScript', words: ['js', 'javascript'], grammar: 'javascript' },
  { label: 'TypeScript', words: ['ts', 'typescript'], grammar: 'typescript' },
  { label: 'JSX', words: ['jsx'], grammar: 'jsx' },
  { label: 'TSX', words: ['tsx'], grammar: 'tsx' },
  { label: 'HTML', words: ['html'], grammar: 'html' },
  { label: 'CSS', words: ['css'], grammar: 'css' },
  { label: 'Diff', words: ['diff'], grammar: 'diff' },
];

const ROW_BY_WORD = new Map(LANGUAGES.flatMap((row) => row.words.map((word) => [word, row] as const)));

// The label for the language word of a fence. No word gives Text. A word that is not in the
// table gives itself, as the author wrote it.
export function labelForLanguage(language: string | undefined): string {
  if (!language) return 'Text';
  return ROW_BY_WORD.get(language.toLowerCase())?.label ?? language;
}

// The grammar for the language word of a fence. No grammar means plain text.
export function grammarForLanguage(language: string | undefined): GrammarId | undefined {
  return language ? ROW_BY_WORD.get(language.toLowerCase())?.grammar : undefined;
}
