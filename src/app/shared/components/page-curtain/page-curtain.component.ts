import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { gsap } from 'gsap';
import { MotionService } from '../../../core/services/motion.service';

/**
 * PAGE CURTAIN
 * ---------------------------------------------------------------------------
 * Route changes are masked by a set of panels that rise, hold while the lazy
 * chunk resolves, then clear upward. Two reasons this earns its place rather
 * than being decoration:
 *
 *   1. Every route is a lazy chunk. Without a cover the reader watches the old
 *      page sit still, then snap — the curtain turns that gap into a beat.
 *   2. It gives the site a single, consistent "cut" between scenes, which is
 *      what makes the scroll story read as one continuous film.
 *
 * A watchdog releases the curtain if a navigation never resolves, and reduced
 * motion skips the whole thing — the component then does nothing at all.
 */
@Component({
  selector: 'app-page-curtain',
  standalone: true,
  template: `
    <div class="curtain" #root aria-hidden="true">
      <div class="curtain__panels">
        @for (panel of panels; track panel) {
          <span class="curtain__panel" data-curtain-panel></span>
        }
      </div>
      <span class="curtain__mark" data-curtain-mark>◈</span>
    </div>
  `,
  styleUrl: './page-curtain.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageCurtain {
  protected readonly panels = [0, 1, 2, 3];

  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');
  private readonly host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly router = inject(Router);
  private readonly motion = inject(MotionService);
  private readonly destroyRef = inject(DestroyRef);

  private timeline: gsap.core.Timeline | null = null;
  private watchdog = 0;
  /** The first navigation is the initial load, already covered by the loader. */
  private seenFirstNavigation = false;
  private covering = false;

  constructor() {
    if (!this.motion.motionAllowed()) {
      return;
    }

    const unsubscribeStart = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (!this.seenFirstNavigation) {
          this.seenFirstNavigation = true;
          return;
        }
        this.cover();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        if (this.covering) {
          // One frame of grace so the incoming view has painted before the
          // curtain clears over it.
          requestAnimationFrame(() => this.reveal());
        }
      }
    });

    this.destroyRef.onDestroy(() => {
      unsubscribeStart.unsubscribe();
      window.clearTimeout(this.watchdog);
      this.timeline?.kill();
      gsap.set(this.host, { clearProps: 'all' });
    });
  }

  private cover(): void {
    const root = this.root().nativeElement;
    const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-curtain-panel]'));
    const mark = root.querySelector<HTMLElement>('[data-curtain-mark]');

    this.covering = true;
    gsap.set(root, { visibility: 'visible', '--curtain-progress': 0 });

    this.timeline?.kill();
    this.timeline = gsap
      .timeline()
      .fromTo(
        panels,
        { yPercent: 101 },
        { yPercent: 0, duration: 0.5, stagger: 0.055, ease: 'power3.inOut' },
      )
      .fromTo(mark, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.3 }, 0.18)
      .to(mark, { opacity: 0, duration: 0.25 }, 0.5);

    // Hard safety: a navigation that hangs (or a chunk that 404s) must not
    // leave the reader staring at a closed curtain.
    window.clearTimeout(this.watchdog);
    this.watchdog = window.setTimeout(() => this.reveal(), 1800);
  }

  private reveal(): void {
    if (!this.covering) {
      return;
    }
    this.covering = false;
    window.clearTimeout(this.watchdog);

    const root = this.root().nativeElement;
    const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-curtain-panel]'));

    this.timeline?.kill();
    this.timeline = gsap
      .timeline()
      .to(panels, { yPercent: -101, duration: 0.55, stagger: 0.05, ease: 'power3.inOut' })
      .set(root, { visibility: 'hidden' });
  }
}
