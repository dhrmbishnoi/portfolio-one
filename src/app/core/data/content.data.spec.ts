import { describe, expect, it } from 'vitest';
import {
  PROJECTS,
  PROJECT_SUMMARIES,
  findProject,
  isProjectSlug,
  nextProject,
  previousProject,
} from './projects.data';
import { JOURNAL, findJournalEntry, isJournalSlug, nextJournalEntry } from './journal.data';

describe('projects.data', () => {
  it('exposes exactly the three selected projects', () => {
    expect(PROJECTS.map((p) => p.slug)).toEqual(['orbital', 'forge', 'signal']);
  });

  it('gives each project a distinct presentation mode', () => {
    const modes = PROJECTS.map((p) => p.presentation);
    expect(new Set(modes).size).toBe(PROJECTS.length);
  });

  it('resolves a project by slug', () => {
    const orbital = findProject('orbital');
    expect(orbital?.title).toBe('Orbital');
    expect(findProject('does-not-exist')).toBeUndefined();
  });

  it('rejects unknown slugs', () => {
    expect(isProjectSlug('orbital')).toBe(true);
    expect(isProjectSlug('')).toBe(false);
    expect(isProjectSlug('Orbital')).toBe(false);
    expect(isProjectSlug('nope')).toBe(false);
  });

  it('walks to the next project and wraps at the end', () => {
    expect(nextProject('orbital').slug).toBe('forge');
    expect(nextProject('forge').slug).toBe('signal');
    expect(nextProject('signal').slug).toBe('orbital');
  });

  it('walks to the previous project and wraps at the start', () => {
    expect(previousProject('orbital').slug).toBe('signal');
    expect(previousProject('forge').slug).toBe('orbital');
  });

  it('degrades gracefully for an unknown slug in next/previous', () => {
    expect(nextProject('unknown').slug).toBe('orbital');
    expect(previousProject('unknown').slug).toBe('forge');
  });

  it('summaries are ordered and match the full case studies', () => {
    expect(PROJECT_SUMMARIES).toHaveLength(PROJECTS.length);
    PROJECT_SUMMARIES.forEach((summary, index) => {
      expect(summary.slug).toBe(PROJECTS[index].slug);
      expect(summary.title).toBe(PROJECTS[index].title);
    });
  });

  it('every case study carries the full magazine section set', () => {
    for (const study of PROJECTS) {
      expect(study.overview.length).toBeGreaterThan(0);
      expect(study.constraints.length).toBeGreaterThan(0);
      expect(study.systemModel.length).toBeGreaterThan(0);
      expect(study.architecture.length).toBeGreaterThan(0);
      expect(study.uiDecisions.length).toBeGreaterThan(0);
      expect(study.accessibility.length).toBeGreaterThan(0);
      expect(study.performance.length).toBeGreaterThan(0);
      expect(study.implementation.length).toBeGreaterThan(0);
      expect(study.tradeoffs.length).toBeGreaterThan(0);
      expect(study.improveNext.length).toBeGreaterThan(0);
      expect(study.diagrams.length).toBeGreaterThan(0);
      expect(study.technicalFocus.length).toBeGreaterThan(0);
    }
  });

  it('records outcomes qualitatively — never as fabricated metrics', () => {
    for (const study of PROJECTS) {
      expect(study.outcome.kind).toBe('qualitative');
      expect(study.outcome.observations.length).toBeGreaterThan(0);
    }
  });

  it('contains no fabricated performance or business metrics', () => {
    // Numeric claims that would have to be measured to be true.
    const fabricated =
      /\d+(?:\.\d+)?\s?(?:x|×|%)\s?(?:faster|improvement|increase|reduction|lighter|smaller)|\$\s?\d|\b\d[\d,.]*\s?(?:users|customers|downloads|signups|MAU|DAU)\b/i;

    for (const study of PROJECTS) {
      expect(JSON.stringify(study)).not.toMatch(fabricated);
    }
    for (const entry of JOURNAL) {
      expect(JSON.stringify(entry)).not.toMatch(fabricated);
    }
  });

  it('states plainly that outcomes are qualitative', () => {
    for (const study of PROJECTS) {
      expect(study.outcome.statement.toLowerCase()).toMatch(
        /not (?:reported|quantified|measured)|qualitative|no .* claim/,
      );
    }
  });
});

describe('journal.data', () => {
  it('lists the five articles newest first', () => {
    expect(JOURNAL).toHaveLength(5);
    const dates = JOURNAL.map((entry) => entry.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it('resolves an article by slug', () => {
    const entry = findJournalEntry('signals-rxjs-state-ownership');
    expect(entry?.title).toBe('Signals, RxJS and State Ownership');
    expect(findJournalEntry('missing')).toBeUndefined();
  });

  it('rejects unknown article slugs', () => {
    expect(isJournalSlug('accessibility-beyond-checklists')).toBe(true);
    expect(isJournalSlug('missing')).toBe(false);
    expect(isJournalSlug('')).toBe(false);
  });

  it('walks to the next article and wraps at the end', () => {
    expect(nextJournalEntry('signals-rxjs-state-ownership').slug).toBe(
      'frontend-architecture-that-ages-well',
    );
    expect(nextJournalEntry(JOURNAL[JOURNAL.length - 1].slug).slug).toBe(JOURNAL[0].slug);
  });

  it('falls back to the first article for an unknown slug', () => {
    expect(nextJournalEntry('unknown').slug).toBe(JOURNAL[0].slug);
  });

  it('every article points at a body document', () => {
    for (const entry of JOURNAL) {
      expect(entry.bodyPath).toMatch(/^\/assets\/content\/journal\/[\w-]+\.json$/);
      expect(entry.excerpt.length).toBeGreaterThan(20);
      expect(entry.readingTime).toMatch(/^\d+ min$/);
    }
  });
});
