import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { SITE } from '../../../core/config/site.config';
import { MotionService, nextFrame } from '../../../core/services/motion.service';

gsap.registerPlugin(MotionPathPlugin);

/**
 * HERO
 * ---------------------------------------------------------------------------
 * Editorial, text-first. No portrait, no stock photography, no 3D, no dashboard
 * mockup — the composition is a headline, a short argument, a technical strip
 * and a narrow "technical notebook" running down the right of the grid.
 *
 * Load sequence (once, never looped):
 *   eyebrow → headline line-by-line → supporting copy → CTAs → technical strip
 *   → diagram rules draw → one active node travels the architecture once.
 */
@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero implements OnDestroy {
  private readonly host: HTMLElement = inject(ElementRef).nativeElement as HTMLElement;
  private readonly motion = inject(MotionService);
  private readonly scope = this.motion.scope(inject(ElementRef).nativeElement as HTMLElement);

  protected readonly site = SITE;
  protected readonly eyebrow = 'Senior frontend / product engineer';
  protected readonly stack = SITE.technicalStack;

  protected readonly headlineLines = ['Engineering interfaces', 'for products that', 'need to last.'];

  constructor() {
    afterNextRender(() => void this.play());
  }

  ngOnDestroy(): void {
    this.scope.revert();
  }

  private async play(): Promise<void> {
    if (!this.motion.motionAllowed()) {
      return;
    }

    await nextFrame();
    this.scope.run(() => {
      const root = this.host;

      gsap.set('[data-hero-eyebrow]', { opacity: 0, y: -6 });
      gsap.set('[data-hero-line]', { yPercent: 112, opacity: 0 });
      gsap.set('[data-hero-copy]', { opacity: 0, y: 14 });
      gsap.set('[data-hero-cta]', { opacity: 0, y: 10 });
      gsap.set('[data-hero-strip]', { opacity: 0, y: 12 });
      gsap.set('[data-hero-panel]', { opacity: 0, y: 10 });
      gsap.set('[data-hero-rule]', { scaleX: 0, transformOrigin: 'left center' });
      gsap.set('[data-hero-traveller]', { opacity: 0 });

      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

      timeline
        .to('[data-hero-eyebrow]', { opacity: 1, y: 0, duration: 0.5 })
        .to('[data-hero-line]', { yPercent: 0, opacity: 1, duration: 0.85, stagger: 0.09 }, '-=0.28')
        .to('[data-hero-copy]', { opacity: 1, y: 0, duration: 0.6 }, '-=0.45')
        .to('[data-hero-cta]', { opacity: 1, y: 0, duration: 0.5, stagger: 0.06 }, '-=0.35')
        .to('[data-hero-strip]', { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
        .to('[data-hero-panel]', { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 }, '-=0.5')
        .to('[data-hero-rule]', { scaleX: 1, duration: 0.6, stagger: 0.04 }, '-=0.35')
        .to('[data-hero-traveller]', { opacity: 1, duration: 0.3 }, '-=0.2');

      // One active node travels the dependency path exactly once.
      const path = root.querySelector<SVGPathElement>('[data-hero-path]');
      const traveller = root.querySelector<SVGCircleElement>('[data-hero-traveller]');

      if (path && traveller) {
        timeline.to(
          traveller,
          {
            duration: 1.5,
            ease: 'power1.inOut',
            motionPath: { path, align: path, alignOrigin: [0.5, 0.5] },
            onComplete: () => {
              gsap.to(traveller, { opacity: 0.3, duration: 0.4, delay: 0.5 });
            },
          },
          '-=0.15',
        );
      }
    });
  }
}
