// The content module reads MDX content from a content folder. The default folder is
// content/ under the project root, and tests pass a fixture folder. The module never
// reads the environment: callers decide whether to include Drafts.
export { ContentError } from './frontmatter';
export { getFacets, getPost, getPosts } from './posts';
export type { Facets, Post, PostFilters, PostOptions } from './posts';
