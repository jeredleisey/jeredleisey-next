// The label table of the Code Block. One row for each label, with the fence words that give
// it. A new language is one new row.
const LANGUAGES: { label: string; words: string[] }[] = [
  { label: 'Text', words: ['text', 'txt'] },
  { label: 'Shell', words: ['sh', 'shell', 'zsh'] },
  { label: 'Bash', words: ['bash'] },
  { label: 'JSON', words: ['json'] },
  { label: 'YAML', words: ['yaml', 'yml'] },
  { label: 'Python', words: ['python', 'py'] },
  { label: 'SQL', words: ['sql'] },
  { label: 'Nginx', words: ['nginx'] },
  { label: 'JavaScript', words: ['js', 'javascript'] },
  { label: 'TypeScript', words: ['ts', 'typescript'] },
  { label: 'JSX', words: ['jsx'] },
  { label: 'TSX', words: ['tsx'] },
  { label: 'HTML', words: ['html'] },
  { label: 'CSS', words: ['css'] },
  { label: 'Diff', words: ['diff'] },
];

const LABEL_BY_WORD = new Map(
  LANGUAGES.flatMap(({ label, words }) => words.map((word) => [word, label] as const)),
);

// The label for the language word of a fence. No word gives Text. A word that is not in the
// table gives itself, as the author wrote it.
export function labelForLanguage(language: string | undefined): string {
  if (!language) return 'Text';
  return LABEL_BY_WORD.get(language.toLowerCase()) ?? language;
}
