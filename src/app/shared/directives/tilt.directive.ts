import { Directive, ElementRef, inject, input, type OnDestroy } from '@angular/core';
import { gsap } from 'gsap';
import { MotionService } from '../../core/services/motion.service';

export interface TiltOptions {
  /** Maximum rotation in degrees on each axis. */
  readonly max?: number;
  /** Scale applied while the pointer is over the element. */
  readonly scale?: number;
  /** Lift in pixels toward the viewer. */
  readonly lift?: number;
  /** How quickly the element follows the pointer (0–1). */
  readonly follow?: number;
}

/**
 * TILT DIRECTIVE
 * ---------------------------------------------------------------------------
 * Pointer-driven 3D rotation with a light source that tracks the cursor. The
 * rotation is applied to the host, the glare to a `::after` layer that reads
 * the `--tilt-x` / `--tilt-y` custom properties, and both are driven through
 * `gsap.quickTo` so no tween objects are allocated per pointer event.
 *
 * Only bound on fine pointers with motion allowed, and always released on
 * destroy — a stuck transform is worse than no effect.
 */
@Directive({ selector: '[appTilt]' })
export class TiltDirective implements OnDestroy {
  /** Bare (`appTilt`) or configured (`[appTilt]="{ max: 9 }"`). */
  readonly appTilt = input<TiltOptions | number | ''>('');

  private readonly host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly motion = inject(MotionService);
  private readonly enabled: boolean;

  private rotateX: ((value: number) => void) | null = null;
  private rotateY: ((value: number) => void) | null = null;
  private liftTo: ((value: number) => void) | null = null;
  private scaleTo: ((value: number) => void) | null = null;

  constructor() {
    this.enabled = this.motion.motionAllowed() && this.motion.finePointer;
    if (!this.enabled) {
      return;
    }

    gsap.set(this.host, { transformPerspective: 900, transformStyle: 'preserve-3d' });

    this.rotateX = gsap.quickTo(this.host, 'rotationX', {
      duration: 0.5,
      ease: 'power3.out',
    }) as (value: number) => void;
    this.rotateY = gsap.quickTo(this.host, 'rotationY', {
      duration: 0.5,
      ease: 'power3.out',
    }) as (value: number) => void;
    this.liftTo = gsap.quickTo(this.host, 'z', { duration: 0.5, ease: 'power3.out' }) as (
      value: number,
    ) => void;
    this.scaleTo = gsap.quickTo(this.host, 'scale', { duration: 0.6, ease: 'power3.out' }) as (
      value: number,
    ) => void;

    this.host.addEventListener('pointermove', this.onMove);
    this.host.addEventListener('pointerenter', this.onEnter);
    this.host.addEventListener('pointerleave', this.onLeave);
    this.host.dataset['tilt'] = 'ready';
  }

  ngOnDestroy(): void {
    this.host.removeEventListener('pointermove', this.onMove);
    this.host.removeEventListener('pointerenter', this.onEnter);
    this.host.removeEventListener('pointerleave', this.onLeave);
    delete this.host.dataset['tilt'];
    gsap.killTweensOf(this.host);
    gsap.set(this.host, { clearProps: 'transform' });
    this.host.style.removeProperty('--tilt-x');
    this.host.style.removeProperty('--tilt-y');
  }

  private readonly onMove = (event: PointerEvent): void => {
    const rect = this.host.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width; // 0 → 1
    const py = (event.clientY - rect.top) / rect.height;
    const options = this.options();
    const max = options.max ?? 7;

    this.rotateY?.((px - 0.5) * max * 2);
    this.rotateX?.(-(py - 0.5) * max * 2);
    this.host.style.setProperty('--tilt-x', `${px * 100}%`);
    this.host.style.setProperty('--tilt-y', `${py * 100}%`);
  };

  private readonly onEnter = (): void => {
    const options = this.options();
    this.scaleTo?.(options.scale ?? 1.012);
    this.liftTo?.(options.lift ?? 14);
  };

  private readonly onLeave = (): void => {
    this.rotateX?.(0);
    this.rotateY?.(0);
    this.liftTo?.(0);
    this.scaleTo?.(1);
  };

  private options(): TiltOptions {
    const input = this.appTilt();
    if (input === '') {
      return { max: 7, scale: 1.012, lift: 14 };
    }
    return typeof input === 'number' ? { max: input } : input;
  }
}
