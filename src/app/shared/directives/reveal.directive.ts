import { Directive, ElementRef, OnInit, OnDestroy, inject, input } from '@angular/core';
import { gsap } from 'gsap';
import { MotionService, type RevealVariant } from '../../core/services/motion.service';

/**
 * REVEAL DIRECTIVE
 * ---------------------------------------------------------------------------
 * Declarative scroll reveal built on the shared motion vocabulary. It is a
 * no-op under `prefers-reduced-motion: reduce` and when GSAP has not been given
 * permission to run — the element simply stays in its final CSS state, which is
 * always the readable one.
 *
 * Usage: <div appReveal="rise" [appRevealDelay]="0.1">
 */
@Directive({
  selector: '[appReveal]',
  standalone: true,
})
export class RevealDirective implements OnInit, OnDestroy {
  readonly appReveal = input<RevealVariant>('rise');
  readonly appRevealDelay = input(0);
  readonly appRevealStagger = input(0);

  private readonly motion = inject(MotionService);
  private readonly host = inject(ElementRef).nativeElement as HTMLElement;
  private tween: gsap.core.Tween | null = null;

  ngOnInit(): void {
    if (!this.motion.motionAllowed()) {
      return;
    }

    const variant = this.appReveal();
    const from: gsap.TweenVars = {
      rise: { opacity: 0, y: 18 },
      fade: { opacity: 0 },
      line: { opacity: 0, scaleX: 0, transformOrigin: 'left center' },
      mask: { opacity: 0, clipPath: 'inset(0 0 100% 0)' },
      settle: { opacity: 0, y: 14, scale: 0.985 },
    }[variant];

    const targets = this.appRevealStagger() > 0 ? this.host.querySelectorAll(':scope > *') : this.host;

    this.tween = gsap.from(targets, {
      ...from,
      duration: 0.7,
      delay: this.appRevealDelay(),
      ease: 'power3.out',
      stagger: this.appRevealStagger() || undefined,
      scrollTrigger: {
        trigger: this.host,
        start: 'top 88%',
        once: true,
      },
    });
  }

  ngOnDestroy(): void {
    this.tween?.scrollTrigger?.kill();
    this.tween?.kill();
  }
}
