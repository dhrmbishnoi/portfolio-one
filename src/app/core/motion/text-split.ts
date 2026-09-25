/**
 * TEXT SPLIT
 * ---------------------------------------------------------------------------
 * Splits an element's text into masked lines, words or characters so a timeline
 * can move them independently — the single technique that separates "things
 * fade in" from "typography performs".
 *
 * Design rules:
 *  · Accessible. The original markup is captured first, fragments are wrapped in
 *    `aria-hidden` spans and the host keeps its readable copy via `aria-label`,
 *    so assistive tech never hears the fragments.
 *  · Reversible. `revert()` restores the exact original inner HTML.
 *  · Inline-safe. Emphasis elements (`<em>`, `<b>`, `<span>`) survive as units —
 *    only their text is fragmented, and they are moved whole into their line.
 *  · Whitespace-safe. Each word span carries its surrounding whitespace and is
 *    rendered with `white-space: pre`, so no space is ever lost when fragments
 *    are regrouped into lines.
 *  · Measured, not assumed. Line grouping comes from real layout reads, so it
 *    stays correct through font swaps, fluid type and responsive reflow.
 */

export type SplitMode = 'lines' | 'words' | 'chars';

export interface SplitResult {
  /** Masked line wrappers (empty in words/chars mode). */
  readonly lines: HTMLElement[];
  /** Word spans. */
  readonly words: HTMLElement[];
  /** Character spans (empty unless mode is 'chars'). */
  readonly chars: HTMLElement[];
  /** The elements a timeline should animate: line inners, words or chars. */
  readonly targets: HTMLElement[];
  readonly originalText: string;
  revert(): void;
}

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'CANVAS', 'BR']);

export function splitText(element: HTMLElement, mode: SplitMode): SplitResult {
  const original = element.innerHTML;
  const originalText = element.textContent ?? '';
  const words: HTMLElement[] = [];
  const chars: HTMLElement[] = [];

  fragmentChildren(element, mode, words, chars);

  element.setAttribute('data-split', mode);
  const lines = mode === 'lines' ? groupIntoLines(element) : [];
  const targets: HTMLElement[] = lines.length ? lines : mode === 'chars' ? chars : words;

  element.setAttribute('aria-label', originalText.replace(/\s+/g, ' ').trim());
  element.querySelectorAll<HTMLElement>('.split__line, .split__word, .split__char').forEach(
    (node) => node.setAttribute('aria-hidden', 'true'),
  );

  let reverted = false;
  return {
    lines,
    words,
    chars,
    targets,
    originalText,
    revert(): void {
      if (reverted) {
        return;
      }
      reverted = true;
      element.innerHTML = original;
      element.removeAttribute('aria-label');
      element.removeAttribute('data-split');
      element.querySelectorAll('[data-split]').forEach((node) =>
        node.removeAttribute('data-split'),
      );
    },
  };
}

function fragmentChildren(
  parent: HTMLElement,
  mode: SplitMode,
  words: HTMLElement[],
  chars: HTMLElement[],
): void {
  Array.from(parent.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      if (!text.trim()) {
        return;
      }
      const fragment = document.createDocumentFragment();
      buildFragments(text, mode, words, chars, parent).forEach((piece) =>
        fragment.appendChild(piece),
      );
      parent.replaceChild(fragment, node);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as HTMLElement;
    if (SKIP_TAGS.has(element.tagName)) {
      return;
    }
    if (element.classList.contains('split__word') || element.classList.contains('split__char')) {
      return;
    }

    const hasElementChildren = Array.from(element.childNodes).some(
      (child) => child.nodeType === Node.ELEMENT_NODE,
    );

    if (hasElementChildren) {
      fragmentChildren(element, mode, words, chars);
      return;
    }

    const text = element.textContent ?? '';
    if (!text.trim()) {
      return;
    }
    element.textContent = '';
    buildFragments(text, mode, words, chars, element).forEach((piece) =>
      element.appendChild(piece),
    );
  });
}

/**
 * Turns one text run into word (and, in `chars` mode, character) spans.
 * Whitespace is folded into the *next* word, or appended to the previous one
 * when the run ends — never emitted as a loose text node, because a loose node
 * would be stranded outside its line wrapper.
 */
function buildFragments(
  text: string,
  mode: SplitMode,
  words: HTMLElement[],
  chars: HTMLElement[],
  scope: HTMLElement,
): Node[] {
  const nodes: Node[] = [];
  let pendingSpace = '';
  let lastWord: HTMLElement | null = null;

  for (const segment of text.split(/(\s+)/)) {
    if (!segment) {
      continue;
    }

    if (!segment.trim()) {
      if (mode === 'chars') {
        const space = document.createElement('span');
        space.className = 'split__char';
        space.textContent = ' ';
        chars.push(space);
        nodes.push(space);
        continue;
      }
      pendingSpace += segment;
      continue;
    }

    const word = document.createElement('span');
    word.className = 'split__word';

    if (mode === 'chars') {
      for (const character of Array.from(segment)) {
        const charSpan = document.createElement('span');
        charSpan.className = 'split__char';
        charSpan.textContent = character;
        word.appendChild(charSpan);
        chars.push(charSpan);
      }
      nodes.push(word);
      words.push(word);
      continue;
    }

    word.textContent = pendingSpace + segment;
    pendingSpace = '';
    nodes.push(word);
    words.push(word);
    lastWord = word;
    scope.setAttribute('data-split', mode);
  }

  // A trailing space has nowhere to go but back onto the previous word.
  if (pendingSpace && mode !== 'chars') {
    if (lastWord) {
      lastWord.textContent = (lastWord.textContent ?? '') + pendingSpace;
    } else {
      // Nothing followed it inside this scope: hand it to the parent element so
      // a nested `<em>word </em>` keeps its trailing space.
      const spacer = document.createElement('span');
      spacer.className = 'split__word';
      spacer.textContent = pendingSpace;
      nodes.push(spacer);
      words.push(spacer);
    }
  }

  return nodes;
}

/**
 * Wraps the host's top-level nodes into `.split__line > .split__inner` pairs
 * using measured layout. Whole nodes are moved, which is what keeps `<em>`
 * styling intact across the regroup.
 */
function groupIntoLines(element: HTMLElement): HTMLElement[] {
  const children = Array.from(element.childNodes).filter(
    (node) =>
      node.nodeType === Node.ELEMENT_NODE ||
      (node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim())),
  ) as HTMLElement[];

  if (!children.length) {
    return [];
  }

  const groups: HTMLElement[][] = [];
  let currentTop: number | null = null;
  let current: HTMLElement[] = [];

  children.forEach((child) => {
    const top = child.getBoundingClientRect?.().top ?? 0;
    if (currentTop === null || Math.abs(top - currentTop) <= 3) {
      current.push(child);
      currentTop = currentTop ?? top;
      return;
    }
    groups.push(current);
    current = [child];
    currentTop = top;
  });
  if (current.length) {
    groups.push(current);
  }

  const lines: HTMLElement[] = [];

  groups.forEach((group) => {
    const line = document.createElement('div');
    line.className = 'split__line';
    const inner = document.createElement('div');
    inner.className = 'split__inner';

    const first = group[0]!;
    first.parentNode?.insertBefore(line, first);
    line.appendChild(inner);
    group.forEach((node) => inner.appendChild(node));
    lines.push(inner);
  });

  return lines;
}
