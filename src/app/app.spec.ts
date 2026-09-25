import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { App } from './app';
import { routes } from './app.routes';

/**
 * APP SHELL — end-to-end through the real router
 * ---------------------------------------------------------------------------
 * Every other suite in this repo mounts one component in isolation; this one
 * boots the application the way a browser does. It navigates the real route
 * table, waits for the lazily loaded page to arrive, and then asserts the
 * things a screenshot would have caught: the shell chrome is present, the
 * routed page actually landed inside `main`, the narrative ids exist, and the
 * `data-motion` flag that unlocks the whole stylesheet was published.
 *
 * The WebGL stage cannot render here (no GPU), so this suite also proves the
 * important half of that story: a home page whose 3D stage has failed still
 * renders its complete narrative.
 */
describe('App shell', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    });
    fixture = TestBed.createComponent(App);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    ScrollTrigger.killAll();
    gsap.globalTimeline.clear();
    gsap.ticker.sleep();
    delete document.documentElement.dataset['motion'];
  });

  it('renders the persistent chrome and routes the home page into main', async () => {
    await router.navigateByUrl('/');
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('a.skip-link')?.getAttribute('href')).toBe('#main');
    expect(root.querySelector('main#main')).toBeTruthy();
    expect(root.querySelector('app-site-header')).toBeTruthy();
    expect(root.querySelector('app-site-footer')).toBeTruthy();
    expect(root.querySelector('.grain')).toBeTruthy();
    expect(root.querySelector('app-cursor')).toBeTruthy();

    // The lazily loaded page is the narrative home, inside the shell's main.
    const main = root.querySelector('main#main')!;
    expect(main.querySelector('app-home')).toBeTruthy();
    expect(main.querySelector('#hero')).toBeTruthy();
    expect(main.querySelector('#contact')).toBeTruthy();
  });

  it('publishes the motion flag that unlocks the animation stylesheet', async () => {
    await router.navigateByUrl('/');
    await fixture.whenStable();
    fixture.detectChanges();

    // MotionService writes this on construction; without it every reveal,
    // split line and mask stays in its visible resting state.
    expect(document.documentElement.dataset['motion']).toBe('ready');
    expect(document.documentElement.style.overflowX).not.toBe('hidden');
  });

  it('keeps the shell intact on a light editorial route', async () => {
    await router.navigateByUrl('/about');
    await fixture.whenStable();
    fixture.detectChanges();
    const main = (fixture.nativeElement as HTMLElement).querySelector('main#main')!;

    expect(main.querySelector('app-about')).toBeTruthy();
    // No WebGL stage outside the home narrative — inner pages are paper.
    expect(document.querySelector('app-scene-stage')).toBeNull();
  });

  it('serves the not-found route for an unknown URL', async () => {
    await router.navigateByUrl('/definitely-not-a-page');
    await fixture.whenStable();
    fixture.detectChanges();
    const main = (fixture.nativeElement as HTMLElement).querySelector('main#main')!;

    expect(main.textContent?.length ?? 0).toBeGreaterThan(0);
    expect(main.querySelector('app-home')).toBeNull();
  });
});
