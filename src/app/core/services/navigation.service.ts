import { DestroyRef, Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { nextFrame } from './motion.service';
import { SmoothScrollService } from './smooth-scroll.service';

/**
 * NAVIGATION LIFECYCLE
 * ---------------------------------------------------------------------------
 * What has to happen after a route change has settled, which is nothing the
 * router does for us:
 *
 *  1. **Re-measure.** The document is a completely different height on the new
 *     page. The smooth scroller's limit and every ScrollTrigger measurement are
 *     both stale at that moment — and a pinned section left holding the previous
 *     page's offsets pins in the wrong place, which is a spectacular failure to
 *     debug from a screenshot. One refresh per navigation, after the new view
 *     has painted.
 *
 *  2. **Move focus.** A client-side navigation moves nothing by itself: focus
 *     stays on the link that was clicked and a screen reader is never told the
 *     page changed. Focusing the new page's `main` is the standard remedy, and
 *     `preventScroll` keeps the browser from jumping the viewport to it.
 *
 * Both are deliberately skipped where they would be wrong: no focus on the first
 * navigation (the reader has not navigated anywhere yet and would be dropped
 * into the middle of the page), and none on an in-page anchor (the browser owns
 * that scroll, and stealing focus would fight it).
 */
@Injectable({ providedIn: 'root' })
export class NavigationLifecycle {
  private readonly router = inject(Router);
  private readonly scroll = inject(SmoothScrollService);
  private readonly destroyRef = inject(DestroyRef);

  private isFirstNavigation = true;

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.settle(event);
      }
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  private settle(event: NavigationEnd): void {
    const isFirst = this.isFirstNavigation;
    this.isFirstNavigation = false;

    // Wait for the incoming view to paint before measuring it.
    void nextFrame().then(() => {
      this.scroll.resize();
      ScrollTrigger.refresh();
    });

    if (isFirst || event.urlAfterRedirects.includes('#')) {
      return;
    }

    document.getElementById('main')?.focus({ preventScroll: true });
  }
}
