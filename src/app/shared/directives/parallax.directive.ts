import { Directive, ElementRef, inject, input, type OnDestroy } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionService } from '../../core/services/motion.service';

/**
 * PARALLAX DIRECTIVE
 * ---------------------------------------------------------------------------
 * Depth for flat media: panels, figures and display numbers drift against the
 * scroll direction. Transform-only, scrubbed, and skipped entirely below the
 * reading breakpoint where drift would break the measure.
 *
 *   <div [appParallax]="60">…</div>
 *   <div [appParallax]="{ distance: 120, scale: 1.06 }">…</div>
 */
@Directive({ selector: '[appParallax]' })
export class ParallaxDirective implements OnDestroy {
  readonly appParallax = input<number | { distance?: number; scale?: number; from?: number }>(80);

  private readonly host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly motion = inject(MotionService);
  private trigger: ScrollTrigger | null = null;
  private tween: gsap.core.Tween | null = null;

  constructor() {
    if (!this.motion.motionAllowed()) {
      return;
    }

    // Wait for layout to settle so the trigger measures real geometry.
    requestAnimationFrame(() => {
      if (!this.motion.motionAllowed() || window.innerWidth < 768) {
        return;
      }
      const options = this.options();
      const distance = options.distance ?? 80;
      const scale = options.scale ?? 1;
      const from = options.from ?? -distance * 0.5;

      this.tween = gsap.fromTo(
        this.host,
        { y: from, scale },
        {
          y: distance * 0.5,
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: this.host,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.65,
          },
        },
      );
      this.trigger = this.tween.scrollTrigger ?? null;
    });
  }

  ngOnDestroy(): void {
    this.trigger?.kill();
    this.tween?.kill();
    gsap.set(this.host, { clearProps: 'transform' });
  }

  private options(): { distance?: number; scale?: number; from?: number } {
    const input = this.appParallax();
    return typeof input === 'number' ? { distance: input } : input;
  }
}
