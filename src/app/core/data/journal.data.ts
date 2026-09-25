/**
 * JOURNAL DATA
 * ---------------------------------------------------------------------------
 * Article metadata is bundled with the app so the list renders on first paint.
 * Article bodies live in `src/assets/content/journal/<slug>.json` and are
 * fetched on demand — a reader who never opens an article never downloads it.
 */

export interface JournalEntry {
  readonly slug: string;
  readonly title: string;
  /** ISO date, used for <time> and article metadata. */
  readonly date: string;
  readonly readingTime: string;
  readonly tag: string;
  readonly excerpt: string;
  /** Absolute path of the fetched body. */
  readonly bodyPath: string;
}

export const JOURNAL: readonly JournalEntry[] = [
  {
    slug: 'frontend-architecture-that-ages-well',
    title: 'Designing Frontend Architecture That Ages Well',
    date: '2025-11-04',
    readingTime: '9 min',
    tag: 'Architecture',
    excerpt:
      'Most frontend architecture advice is written for the first release. This is about the third year, when the team has changed and the requirements have moved twice.',
    bodyPath: '/assets/content/journal/frontend-architecture-that-ages-well.json',
  },
  {
    slug: 'design-system-as-infrastructure',
    title: 'When a Design System Becomes Infrastructure',
    date: '2025-08-19',
    readingTime: '7 min',
    tag: 'Design systems',
    excerpt:
      'The moment a design system becomes infrastructure is the moment nobody has to be persuaded to use it. Here is what that transition actually requires.',
    bodyPath: '/assets/content/journal/design-system-as-infrastructure.json',
  },
  {
    slug: 'performance-budgets-teams-use',
    title: 'Performance Budgets That Teams Can Actually Use',
    date: '2025-06-02',
    readingTime: '8 min',
    tag: 'Performance',
    excerpt:
      'A budget nobody can check is a slogan. The useful kind is one number, in one place, asserted by the same build that ships the code.',
    bodyPath: '/assets/content/journal/performance-budgets-teams-use.json',
  },
  {
    slug: 'accessibility-beyond-checklists',
    title: 'Accessibility Beyond Checklists',
    date: '2025-03-14',
    readingTime: '6 min',
    tag: 'Accessibility',
    excerpt:
      'A checklist gets you to a compliant screen. It does not get you to a usable one. The difference is in the states you specified, not the ones you tested.',
    bodyPath: '/assets/content/journal/accessibility-beyond-checklists.json',
  },
  {
    slug: 'signals-rxjs-state-ownership',
    title: 'Signals, RxJS and State Ownership',
    date: '2024-12-09',
    readingTime: '10 min',
    tag: 'State',
    excerpt:
      'Signals and RxJS are not competitors. Choosing between them is really a question about who owns the state and what happens when two clients change it at once.',
    bodyPath: '/assets/content/journal/signals-rxjs-state-ownership.json',
  },
] as const;

export function findJournalEntry(slug: string): JournalEntry | undefined {
  return JOURNAL.find((entry) => entry.slug === slug);
}

export function isJournalSlug(slug: string): boolean {
  return JOURNAL.some((entry) => entry.slug === slug);
}

/** Next article in reverse-chronological order, wrapping. */
export function nextJournalEntry(slug: string): JournalEntry {
  const index = JOURNAL.findIndex((entry) => entry.slug === slug);
  return JOURNAL[(index + 1) % JOURNAL.length];
}
