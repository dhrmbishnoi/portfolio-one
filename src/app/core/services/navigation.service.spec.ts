import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { App } from '../../app';
import { routes } from '../../app.routes';
import { SmoothScrollService } from './smooth-scroll.service';

/**
 * NAVIGATION LIFECYCLE
 * ---------------------------------------------------------------------------
 * Two things have to happen after a client-side navigation, and neither is the
 * router's job: the smooth scroller and every ScrollTrigger must be re-measured
 * against a document that is suddenly a different height, and focus must move to
 * the new page so a keyboard or screen-reader user is not left on the link they
 * clicked with no announcement that anything happened.
 *
 * The exceptions matter as much as the rule — no focus steal on the first
 * navigation, and none on an in-page anchor — so both are pinned here.
 */
describe('NavigationLifecycle', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;
  let scroll: SmoothScrollService;
  let resize: ReturnType<typeof vi.spyOn>;

  const settle = async (): Promise<void> => {
    await fixture.whenStable();
    fixture.detectChanges();
    // `settle()` waits a frame before measuring; give the promise a turn.
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    });
    fixture = TestBed.createComponent(App);
    router = TestBed.inject(Router);
    scroll = TestBed.inject(SmoothScrollService);
    resize = vi.spyOn(scroll, 'resize');
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    ScrollTrigger.killAll();
    gsap.globalTimeline.clear();
    gsap.ticker.sleep();
    delete document.documentElement.dataset['motion'];
  });

  it('re-measures the scroller and the triggers after a navigation', async () => {
    await router.navigateByUrl('/');
    await settle();

    const before = resize.mock.calls.length;
    await router.navigateByUrl('/about');
    await settle();

    // A pinned section measured against the previous page's height pins in the
    // wrong place, so this is not an optimisation.
    expect(resize.mock.calls.length).toBeGreaterThan(before);
  });

  it('moves focus to the new page, but not on the first navigation', async () => {
    await router.navigateByUrl('/');
    await settle();

    // The reader has not navigated anywhere yet; dropping them into `main`
    // would skip the masthead for no reason.
    expect(document.activeElement?.id).not.toBe('main');

    await router.navigateByUrl('/work');
    await settle();

    expect(document.activeElement?.id).toBe('main');
  });

  it('leaves an in-page anchor alone', async () => {
    await router.navigateByUrl('/');
    await settle();
    await router.navigateByUrl('/about');
    await settle();

    (document.activeElement as HTMLElement | null)?.blur();
    await router.navigateByUrl('/#contact');
    await settle();

    // Anchor navigation is a scroll, not a page change: stealing focus would
    // fight the browser's own handling of the fragment.
    expect(document.activeElement?.id).not.toBe('main');
  });

  it('survives a navigation to a route that does not exist', async () => {
    await router.navigateByUrl('/');
    await settle();

    await expect(router.navigateByUrl('/no-such-page')).resolves.toBe(true);
    await settle();

    expect((fixture.nativeElement as HTMLElement).querySelector('main#main')).toBeTruthy();
  });
});
