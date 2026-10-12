import type { Element, Root, RootContent } from 'hast';

// A rehype plugin. For each pre element that holds a code element, it copies the language
// of the fence (the language-xxx class of the code) to data-language on the pre. A fence
// with no language gets no attribute. The Code Block reads the attribute from its props.
function walk(node: Root | RootContent): void {
  if (!('children' in node)) return;
  if (node.type === 'element' && node.tagName === 'pre') {
    const code = node.children.find(
      (child): child is Element => child.type === 'element' && child.tagName === 'code',
    );
    const language = code && languageOf(code);
    if (language) node.properties = { ...node.properties, 'data-language': language };
  }
  node.children.forEach(walk);
}

function languageOf(code: Element): string | undefined {
  const classes = code.properties?.className;
  if (!Array.isArray(classes)) return undefined;
  const found = classes.find((c) => typeof c === 'string' && c.startsWith('language-'));
  return typeof found === 'string' ? found.slice('language-'.length) : undefined;
}

export function rehypeCodeLanguage() {
  return (tree: Root) => walk(tree);
}
