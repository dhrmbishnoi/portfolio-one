import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { STORY_CHAPTERS } from '../../../core/narrative';
import { Story } from './story.component';

/**
 * STORY — the pinned scrub
 * ---------------------------------------------------------------------------
 * The storyteller's whole claim is that scroll position is the edit: every
 * scroll position equals exactly one frame of the story. That is a numeric
 * relationship between the timeline and the scroll range, so it can be pinned
 * down here — and should be, because it is easy to break by adding one tween
 * too many to the timeline.
 *
 * jsdom has no layout and no scroll: every element measures zero and
 * `window.scrollTo` does nothing, so ScrollTrigger's measured range collapses to
 * NaN. This suite therefore drives the timeline and the trigger's own mapping
 * directly rather than pretending to scroll — the two things that can genuinely
 * regress, and neither of which needs a viewport.
 */
describe('Story', () => {
  let fixture: ComponentFixture<Story>;
  let host: HTMLElement;

  /** The choreography the component owns, found by its trigger element. */
  const storyTrigger = (): ScrollTrigger =>
    ScrollTrigger.getAll().find((instance) => instance.trigger === host)!;

  /** A stand-in for the object ScrollTrigger hands its own callbacks. */
  const at = (progress: number): { progress: number } => ({ progress });

  const scrubTo = (progress: number): void => {
    const instance = storyTrigger();
    instance.animation?.progress(progress);
    instance.vars.onUpdate?.(at(progress) as ScrollTrigger);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [Story] });
    fixture = TestBed.createComponent(Story);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    fixture.destroy();
    ScrollTrigger.killAll();
    gsap.globalTimeline.clear();
    gsap.ticker.sleep();
    delete document.documentElement.dataset['motion'];
  });

  it('builds a pinned timeline over every chapter', () => {
    const instance = storyTrigger();

    expect(instance).toBeTruthy();
    expect(instance.pin).toBeTruthy();
    expect(host.querySelectorAll('[data-story-pin]')).toHaveLength(1);
    expect(host.querySelectorAll('[data-story-chapter]')).toHaveLength(STORY_CHAPTERS.length);
  });

  it('maps scroll progress onto the chapter index', () => {
    const onStage = (): number => {
      // The chapter free of `aria-hidden` is the one the reader is looking at.
      const panels = Array.from(host.querySelectorAll<HTMLElement>('[data-story-chapter]'));
      return panels.findIndex((panel) => panel.getAttribute('aria-hidden') === null);
    };

    scrubTo(0);
    expect(onStage()).toBe(0);

    scrubTo(0.5);
    const middle = onStage();
    expect(middle).toBeGreaterThan(0);
    expect(middle).toBeLessThan(STORY_CHAPTERS.length - 1);

    scrubTo(1);
    expect(onStage()).toBe(STORY_CHAPTERS.length - 1);
  });

  it('paints the progress bar from the timeline rather than a template binding', () => {
    const bar = host.querySelector<HTMLElement>('.story__progress-bar')!;
    // Read through GSAP rather than `style.transform`: GSAP writes whichever
    // transform form the browser prefers, so the property name is an
    // implementation detail and the rendered value is the fact.
    const painted = (): number => Number(gsap.getProperty(bar, 'scaleX'));

    // GSAP writes the transform straight onto the element, tracking the scrub.
    // Binding the bar to a signal instead would re-run change detection on every
    // frame of a pinned section — this test guards the reason it is built this
    // way, and the monotonic walk is what proves the timeline owns it.
    const walk: number[] = [];
    for (const progress of [0.25, 0.5, 0.75, 1]) {
      scrubTo(progress);
      walk.push(painted());
    }

    expect(walk[0]).toBeGreaterThan(0);
    expect(walk[1]).toBeGreaterThan(walk[0]!);
    expect(walk[2]).toBeGreaterThan(walk[1]!);
    expect(walk[3]).toBeCloseTo(1, 2);
  });

  it('derives its scroll range from the chapter count, never from its own timeline', () => {
    // The range is a function of the narrative length. A progress tween of the
    // wrong duration would silently re-map every chapter onto a shorter stretch
    // of scrolling — the failure this guards is invisible on screen.
    const end = storyTrigger().vars.end as () => string;

    expect(end).toBeTypeOf('function');
    expect(end()).toBe(`+=${window.innerHeight * (STORY_CHAPTERS.length + 0.35)}`);
  });

  it('keeps every chapter readable as data, whatever the scrub is doing', () => {
    const panels = Array.from(host.querySelectorAll<HTMLElement>('[data-story-chapter]'));

    panels.forEach((panel, index) => {
      expect(panel.querySelector('h3')?.textContent?.trim()).toBe(
        STORY_CHAPTERS[index]!.title.replace(/\n/g, ''),
      );
      expect(panel.querySelector('p.body-lg')?.textContent?.trim()).toBe(
        STORY_CHAPTERS[index]!.body,
      );
    });
  });
});
