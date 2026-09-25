/**
 * NARRATIVE
 * ---------------------------------------------------------------------------
 * The scroll story the home page tells. Chapters are data, not markup: the
 * pinned storyteller, the chapter rail and the artifact choreography all read
 * from this single list, so the story can be re-cut by editing one file.
 *
 * Each chapter also carries the pose the WebGL artifact should hold while the
 * chapter is on screen — the object performs the narrative rather than
 * decorating it.
 */

import type { StageParams } from './three/artifact';

export interface StoryChapter {
  /** Anchor id — doubles as the ScrollTrigger target name. */
  readonly id: string;
  /** Zero-padded chapter number, e.g. "01". */
  readonly index: string;
  /** Short mono label used by the chapter rail. */
  readonly label: string;
  /** Display headline for the chapter. */
  readonly title: string;
  /** Supporting paragraph. */
  readonly body: string;
  /** Two or three proof points, rendered as a mono list. */
  readonly points: readonly string[];
  /** Metric readout shown large next to the chapter. */
  readonly metric: { readonly value: string; readonly caption: string };
  /** Pose held by the artifact while this chapter is centre-stage. */
  readonly pose: Partial<StageParams>;
}

export const STORY_CHAPTERS: readonly StoryChapter[] = [
  {
    id: 'signal',
    index: '01',
    label: 'Signal',
    title: 'It starts with the\npeople using it.',
    body:
      'Every project opens the same way: watching real work happen in the real interface. Where do people slow down, hesitate, or build a workaround? That friction is the brief — everything after it is engineering.',
    points: [
      'Session reviews and support-ticket mining before a single component',
      'Interaction budgets agreed with design as numbers, not adjectives',
      'The smallest interface that removes the friction',
    ],
    metric: { value: '3', caption: 'sessions before any code' },
    pose: { x: 0.44, y: 0.04, scale: 0.86, energy: 0.2, glow: 0.45, wire: 0.15, spin: 0.8, spread: 0.9 },
  },
  {
    id: 'system',
    index: '02',
    label: 'System',
    title: 'Then the shape of\nthe thing.',
    body:
      'Architecture is a set of decisions about where truth lives, what may change together, and which boundaries are worth paying for. I write those decisions down — because a system nobody can explain is a system nobody can extend.',
    points: [
      'One writer per piece of state; everything else derived',
      'Feature boundaries that survive a rewrite of the framework',
      'Design tokens as the contract between design and code',
    ],
    metric: { value: '1', caption: 'source of truth per fact' },
    pose: { x: 0.42, y: 0, scale: 1.02, energy: 0.42, glow: 0.6, wire: 0.4, spin: 1.1, spread: 1.05 },
  },
  {
    id: 'craft',
    index: '03',
    label: 'Craft',
    title: 'Then the part\nnobody sees.',
    body:
      'Performance, accessibility and resilience are not phases at the end of a plan. They are the daily texture of the work: what we ship, measure, and refuse to regress.',
    points: [
      'Interaction latency budgeted in the pull request, not the retro',
      'Keyboard paths and reduced-motion fallbacks designed, not patched',
      'Every animation reversible, cancellable and cheap',
    ],
    metric: { value: '60fps', caption: 'on a four-year-old laptop' },
    pose: { x: 0.4, y: 0.02, scale: 1.14, energy: 0.78, glow: 0.85, wire: 0.75, spin: 1.6, spread: 1.2 },
  },
  {
    id: 'outcome',
    index: '04',
    label: 'Outcome',
    title: 'And then it gets\nboring — the good way.',
    body:
      'Success is a system that stops being a topic. Releases get smaller, the CSS gets simpler, new engineers ship in their first week, and the interface disappears into the product it was built for.',
    points: [
      'Handover docs, decision records and a working upgrade path',
      'Bundle and interaction budgets enforced by CI',
      'A codebase the next team wants to inherit',
    ],
    metric: { value: '7+', caption: 'years of interfaces that lasted' },
    pose: { x: 0.46, y: 0.06, scale: 0.94, energy: 0.3, glow: 0.7, wire: 0.2, spin: 0.9, spread: 1 },
  },
];

/** Chapter rail entries for the whole home narrative, in document order. */
export interface RailChapter {
  readonly id: string;
  readonly label: string;
}

export const HOME_CHAPTERS: readonly RailChapter[] = [
  { id: 'hero', label: 'Intro' },
  { id: 'story', label: 'Story' },
  { id: 'work', label: 'Work' },
  { id: 'systems', label: 'Systems' },
  { id: 'method', label: 'Method' },
  { id: 'contact', label: 'Contact' },
];
