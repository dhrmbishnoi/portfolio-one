import { Directive, ElementRef, inject, input, type OnDestroy } from '@angular/core';
import { gsap } from 'gsap';
import { MotionService } from '../../core/services/motion.service';

export interface MagneticOptions {
  /** Fraction of the pointer offset the element follows (0.1 – 0.6 reads best). */
  readonly strength?: number;
  /** Extra pull applied to the inner `.magnetic__inner` element, if present. */
  readonly innerStrength?: number;
  /** Radius, in pixels beyond the element's box, that still attracts it. */
  readonly radius?: number;
}

/**
 * MAGNETIC DIRECTIVE
 * ---------------------------------------------------------------------------
 * Buttons and links that lean toward the cursor and settle back with a spring.
 * The pull is capped, so the element never leaves its own hit area — a magnetic
 * control that dodges the pointer is a usability bug, not a flourish.
 */
@Directive({ selector: '[appMagnetic]' })
export class MagneticDirective implements OnDestroy {
  /** Bare (`appMagnetic`) or configured (`[appMagnetic]="{ strength: 0.3 }"`). */
  readonly appMagnetic = input<MagneticOptions | number | ''>('');

  private readonly host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly motion = inject(MotionService);
  private readonly enabled: boolean;

  private xTo: ((value: number) => void) | null = null;
  private yTo: ((value: number) => void) | null = null;
  private innerXTo: ((value: number) => void) | null = null;
  private innerYTo: ((value: number) => void) | null = null;
  private inner: HTMLElement | null = null;

  constructor() {
    this.enabled = this.motion.motionAllowed() && this.motion.finePointer;
    if (!this.enabled) {
      return;
    }

    this.inner = this.host.querySelector<HTMLElement>('.magnetic__inner');
    const ease = { duration: 0.55, ease: 'power3.out' };
    this.xTo = gsap.quickTo(this.host, 'x', ease) as (value: number) => void;
    this.yTo = gsap.quickTo(this.host, 'y', ease) as (value: number) => void;

    if (this.inner) {
      this.innerXTo = gsap.quickTo(this.inner, 'x', ease) as (value: number) => void;
      this.innerYTo = gsap.quickTo(this.inner, 'y', ease) as (value: number) => void;
    }

    window.addEventListener('pointermove', this.onMove, { passive: true });
    this.host.dataset['magnetic'] = 'ready';
  }

  ngOnDestroy(): void {
    window.removeEventListener('pointermove', this.onMove);
    delete this.host.dataset['magnetic'];
    gsap.killTweensOf(this.host);
    if (this.inner) {
      gsap.killTweensOf(this.inner);
    }
    gsap.set(this.host, { clearProps: 'transform' });
  }

  private readonly onMove = (event: PointerEvent): void => {
    const options = this.options();
    const strength = options.strength ?? 0.32;
    const radius = options.radius ?? 90;
    const rect = this.host.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const distance = Math.hypot(dx - rect.width / 2, dy - rect.height / 2);

    const within = Math.max(rect.width, rect.height) / 2 + radius;
    if (distance > within) {
      this.release();
      return;
    }

    const pull = 1 - Math.min(1, distance / within);
    const offsetX = dx * strength * pull;
    const offsetY = dy * strength * pull;

    this.xTo?.(clamp(offsetX, rect.width * 0.28));
    this.yTo?.(clamp(offsetY, rect.height * 0.34));

    const innerStrength = options.innerStrength ?? 0.5;
    this.innerXTo?.(clamp(offsetX * innerStrength, rect.width * 0.18));
    this.innerYTo?.(clamp(offsetY * innerStrength, rect.height * 0.22));
  };

  private release(): void {
    this.xTo?.(0);
    this.yTo?.(0);
    this.innerXTo?.(0);
    this.innerYTo?.(0);
  }

  private options(): MagneticOptions {
    const input = this.appMagnetic();
    if (input === '') {
      return { strength: 0.32, innerStrength: 0.5 };
    }
    return typeof input === 'number' ? { strength: input } : input;
  }
}

function clamp(value: number, limit: number): number {
  return Math.max(-limit, Math.min(limit, value));
}
