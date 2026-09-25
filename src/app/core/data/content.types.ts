/**
 * CONTENT TYPES
 * ---------------------------------------------------------------------------
 * Typed shapes shared by the data modules, the JSON article bodies in
 * `src/assets/content/journal/` and the components that render them. Keeping the
 * contract in one place means content can move between bundled data and fetched
 * JSON without touching a template.
 */

export interface CodeSample {
  /** Language id — drives the lightweight tokeniser. */
  readonly language: 'typescript' | 'html' | 'scss' | 'bash' | 'json';
  readonly filename?: string;
  readonly code: string;
  readonly caption?: string;
}

export interface MarginNote {
  readonly label: string;
  readonly text: string;
}

export interface PullQuote {
  readonly text: string;
  readonly attribution?: string;
}

/** Reusable technical diagram kinds rendered by <app-technical-diagram>. */
export type DiagramKind =
  | 'architecture-map'
  | 'token-graph'
  | 'state-flow'
  | 'dependency-graph'
  | 'performance-trace'
  | 'viewport-grid';

export interface DiagramSpec {
  readonly kind: DiagramKind;
  readonly caption: string;
}

/** Block types used by fetched journal article bodies. */
export type ArticleBlock =
  | { readonly kind: 'paragraph'; readonly text: string }
  | { readonly kind: 'heading'; readonly text: string }
  | { readonly kind: 'list'; readonly items: readonly string[] }
  | { readonly kind: 'quote'; readonly text: string; readonly attribution?: string }
  | { readonly kind: 'note'; readonly label: string; readonly text: string }
  | {
      readonly kind: 'code';
      readonly language: 'typescript' | 'html' | 'scss' | 'bash' | 'json';
      readonly filename?: string;
      readonly code: string;
    };

export interface ArticleBody {
  readonly slug: string;
  readonly blocks: readonly ArticleBlock[];
}
