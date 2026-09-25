/**
 * Tiny, dependency-free syntax highlighter.
 * ---------------------------------------------------------------------------
 * The site shows code samples; pulling in a highlighting library would cost more
 * than the entire observability page it is used on. This tokenises the small,
 * known set of languages used in the content and emits escaped HTML with token
 * classes defined in `_components.scss`.
 */

export type HighlightLanguage = 'typescript' | 'html' | 'scss' | 'bash' | 'json';

const KEYWORDS = new Set([
  'abstract', 'as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const',
  'continue', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends',
  'false', 'finally', 'for', 'from', 'function', 'if', 'implements', 'import',
  'in', 'instanceof', 'interface', 'let', 'new', 'null', 'of', 'private',
  'protected', 'public', 'readonly', 'return', 'satisfies', 'static', 'super',
  'switch', 'this', 'throw', 'true', 'try', 'type', 'typeof', 'undefined',
  'var', 'void', 'while', 'yield',
]);

const SCSS_AT_RULES = new Set(['use', 'forward', 'mixin', 'include', 'if', 'else', 'each', 'return']);

const BASH_COMMANDS = new Set(['npm', 'npx', 'ng', 'node', 'git', 'cd', 'ls', 'echo', 'export', 'rm', 'mkdir']);

const PATTERNS: Record<HighlightLanguage, RegExp> = {
  typescript:
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|\b(\d+(?:\.\d+)?)\b|(@[A-Za-z][\w.]*)|\b([A-Za-z_$][\w$]*)\b/g,
  html:
    /(&lt;!--[\s\S]*?--&gt;|\/\*[\s\S]*?\*\/)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")|(&lt;\/?[a-zA-Z][\w-]*|\/?&gt;)|\b([a-zA-Z-]+)(?==)/g,
  scss:
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")|\$[a-zA-Z][\w-]*|(@[a-zA-Z-]+)|#[0-9a-fA-F]{3,8}\b|\b(\d+(?:\.\d+)?(?:px|rem|em|%|s|ms|vh|vw)?)\b|\b([a-zA-Z-]+)(?=\s*:)/g,
  bash:
    /(#[^\n]*)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")|\b(npm|npx|ng|node|git|cd|ls|echo|export|rm|mkdir|--?[a-zA-Z][\w-]*)\b/g,
  json:
    /("(?:[^"\\]|\\.)*")(\s*:)?|\b(true|false|null)\b|\b(-?\d+(?:\.\d+)?)\b/g,
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function classify(language: HighlightLanguage, match: RegExpExecArray): string | null {
  const [raw, comment, string, number, at, word] = match;

  if (language === 'json') {
    if (match[2]) return 'tok-key';
    if (raw.startsWith('"')) return 'tok-str';
    if (match[3]) return 'tok-key';
    if (match[4]) return 'tok-num';
    return null;
  }

  if (comment) return 'tok-com';
  if (string) return 'tok-str';
  if (number) return 'tok-num';
  if (at) return 'tok-key';

  if (language === 'html') {
    if (raw.startsWith('&lt;') || raw.startsWith('&gt;') || raw === '/&gt;') return 'tok-key';
    if (word) return 'tok-typ';
    return null;
  }

  if (language === 'scss') {
    if (raw.startsWith('$')) return 'tok-typ';
    if (raw.startsWith('#')) return 'tok-num';
    if (raw.startsWith('@')) return 'tok-key';
    if (word) return 'tok-typ';
    return null;
  }

  if (language === 'bash') {
    if (BASH_COMMANDS.has(raw)) return 'tok-fn';
    if (raw.startsWith('-')) return 'tok-typ';
    return null;
  }

  if (KEYWORDS.has(word ?? '')) return 'tok-key';
  if (word && /^[A-Z]/.test(word)) return 'tok-typ';
  if (word && /^[a-z][\w$]*$/.test(word) && match[0].endsWith('(')) return 'tok-fn';

  return null;
}

/** Escape and tokenise a code sample into HTML. */
export function highlight(code: string, language: HighlightLanguage): string {
  const escaped = escapeHtml(code);
  const pattern = new RegExp(PATTERNS[language].source, 'g');

  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(escaped)) !== null) {
    result += escaped.slice(lastIndex, match.index);
    const token = classify(language, match);
    result += token
      ? `<span class="${token}">${match[0]}</span>`
      : match[0];
    lastIndex = match.index + match[0].length;

    if (match[0].length === 0) {
      pattern.lastIndex += 1;
    }
  }

  result += escaped.slice(lastIndex);
  return result;
}
