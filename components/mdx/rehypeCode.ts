import type { Element, Root, RootContent } from 'hast';
import { grammarForLanguage } from './languages';
import { getHighlighter, THEMES } from './highlighter';

// A rehype plugin with two jobs. For each pre element that holds a code element:
// 1. It copies the language of the fence (the language-xxx class of the code) to data-language
//    on the pre. A fence with no language gets no attribute. The Code Block reads the attribute.
// 2. When the language has a grammar in the label table, it replaces the text of the code with
//    highlighted line and token spans. Each token carries its two colors as the CSS variables
//    --shiki-light and --shiki-dark. A language with no grammar stays plain text.
// A highlight that throws is not caught. It fails the render and the build.
async function walk(node: Root | RootContent): Promise<void> {
  if (!('children' in node)) return;
  if (node.type === 'element' && node.tagName === 'pre') {
    const code = node.children.find(
      (child): child is Element => child.type === 'element' && child.tagName === 'code',
    );
    const language = code && languageOf(code);
    if (language) node.properties = { ...node.properties, 'data-language': language };
    const grammar = grammarForLanguage(language);
    if (code && grammar) await highlight(code, grammar);
  }
  for (const child of node.children) await walk(child);
}

async function highlight(code: Element, lang: string): Promise<void> {
  const text = code.children.map((child) => (child.type === 'text' ? child.value : '')).join('');
  const highlighter = await getHighlighter();
  const root = highlighter.codeToHast(text, { lang, themes: THEMES, defaultColor: false });
  const pre = root.children[0];
  const inner = pre?.type === 'element' ? pre.children[0] : undefined;
  if (inner?.type === 'element') code.children = inner.children;
}

function languageOf(code: Element): string | undefined {
  const classes = code.properties?.className;
  if (!Array.isArray(classes)) return undefined;
  const found = classes.find((c) => typeof c === 'string' && c.startsWith('language-'));
  return typeof found === 'string' ? found.slice('language-'.length) : undefined;
}

export function rehypeCode() {
  return (tree: Root) => walk(tree);
}
