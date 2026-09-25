import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HomeComponent } from './home.component';
import { HOME_CHAPTERS, STORY_CHAPTERS } from '../../core/narrative';

/**
 * HOME — narrative integration
 * ---------------------------------------------------------------------------
 * The scroll story is data-driven: the rail navigates to ids that sections must
 * actually own, and the pinned chapters must all be present in the DOM before
 * any timeline is built. This suite mounts the real page — with motion enabled,
 * because the jsdom environment reports no reduced-motion preference — and
 * asserts the contract between the narrative data and the markup.
 */
describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    fixture?.destroy();
    ScrollTrigger.killAll();
    gsap.globalTimeline.clear();
    // GSAP's ticker keeps a requestAnimationFrame loop alive; put it to sleep so
    // the test process can exit.
    gsap.ticker.sleep();
    delete document.documentElement.dataset['motion'];
  });

  it('renders every chapter the scroll rail links to', () => {
    HOME_CHAPTERS.forEach((chapter) => {
      expect(document.getElementById(chapter.id), `#${chapter.id} is missing`).toBeTruthy();
    });
  });

  it('dissolves between the dark stage and the paper interlude', () => {
    // The narrative moves between two registers; a hard cut from near-black to
    // daylight reads as a rendering fault rather than an edit, so each edge of
    // the paper run carries a seam. They live on the hosts, which own the
    // paper background the fade has to sit on top of.
    const systems = host.querySelector('app-systems-section')!;
    const principles = host.querySelector('app-principles')!;

    expect(systems.classList.contains('register-seam--top')).toBe(true);
    expect(principles.classList.contains('register-seam--bottom')).toBe(true);
    // Only the outer edges: the two paper sections are contiguous, and a seam
    // between them would draw a dark band across the middle of the interlude.
    expect(systems.classList.contains('register-seam--bottom')).toBe(false);
    expect(principles.classList.contains('register-seam--top')).toBe(false);
  });

  it('renders the stage, the chrome and the opening movement', () => {
    expect(host.querySelector('app-scene-stage')).toBeTruthy();
    expect(host.querySelector('app-scroll-chrome')).toBeTruthy();
    expect(host.querySelector('#hero')).toBeTruthy();
  });

  it('renders every story chapter before any timeline runs', () => {
    const panels = host.querySelectorAll('[data-story-chapter]');
    expect(panels).toHaveLength(STORY_CHAPTERS.length);
    expect(host.querySelectorAll('[data-story-pin]')).toHaveLength(1);
  });

  it('renders the method stages in the horizontal track', () => {
    const stages = host.querySelectorAll('[data-method-stage]');
    expect(stages.length).toBeGreaterThan(1);
    expect(host.querySelectorAll('[data-method-track]')).toHaveLength(1);
  });

  it('moves the story into its pinned register once motion is permitted', () => {
    expect(host.querySelector('#story')?.classList.contains('story--motion')).toBe(true);
    expect(host.querySelector('#method')?.classList.contains('method--motion')).toBe(true);
  });

  it('exposes exactly one chapter to assistive tech while pinned', () => {
    const panels = [...host.querySelectorAll<HTMLElement>('[data-story-chapter]')];
    const exposed = panels.filter((panel) => panel.getAttribute('aria-hidden') === null);
    expect(exposed).toHaveLength(1);
  });

  it('keeps every chapter in the document as real content', () => {
    const panels = [...host.querySelectorAll<HTMLElement>('[data-story-chapter]')];
    expect(panels).toHaveLength(STORY_CHAPTERS.length);
    expect(panels[0]!.textContent).toContain(STORY_CHAPTERS[0]!.title.split('\n')[0]);
    panels.forEach((panel) => expect(panel.querySelector('.story__chapter-body')).toBeTruthy());
  });
});
