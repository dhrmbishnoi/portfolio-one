import { DestroyRef, ElementRef, inject, Injectable, signal } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Motion vocabulary — deliberately narrow. */
export type RevealVariant = 'rise' | 'fade' | 'line' | 'mask' | 'settle';

const VARIANTS: Record<RevealVariant, gsap.TweenVars> = {
  rise: { opacity: 0, y: 18 },
  fade: { opacity: 0 },
  line: { opacity: 0, scaleX: 0, transformOrigin: 'left center' },
  mask: { opacity: 0, clipPath: 'inset(0 0 100% 0)' },
  settle: { opacity: 0, y: 14, scale: 0.985 },
};

/**
 * MOTION SERVICE
 * ---------------------------------------------------------------------------
 * Owns every GSAP interaction in the app so that two rules hold everywhere:
 *
 *  1. Motion is skipped entirely under `prefers-reduced-motion: reduce`, and the
 *     default CSS state is always the final readable state.
 *  2. Every animation lives inside a reverting GSAP context, so leaving a route
 *     can never leave a tween or a ScrollTrigger behind.
 */
@Injectable({ providedIn: 'root' })
export class MotionService {
  private readonly query =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;

  private readonly _reduced = signal(this.query?.matches ?? false);

  /** Reactive reduced-motion preference. */
  readonly reducedMotion = this._reduced.asReadonly();

  /** True when GSAP work is allowed. */
  readonly motionAllowed = signal(!this._reduced());

  constructor() {
    this.query?.addEventListener('change', (event) => {
      this._reduced.set(event.matches);
      this.motionAllowed.set(!event.matches);
      // Anything already on screen must not be left mid-animation.
      if (event.matches) {
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
        gsap.globalTimeline.clear();
      } else {
        ScrollTrigger.refresh();
      }
    });
  }

  /** Bind a reverting animation scope to a host element. */
  scope(host: HTMLElement): GsapScope {
    return new GsapScope(host, this.motionAllowed());
  }
}

/**
 * A GSAP context bound to one component. `run()` is a no-op when motion is not
 * allowed, which is what keeps the "no animation, final state" guarantee.
 */
export class GsapScope {
  private ctx: ReturnType<typeof gsap.context> | null = null;

  constructor(
    private readonly host: HTMLElement,
    private readonly allowed: boolean,
  ) {}

  get enabled(): boolean {
    return this.allowed;
  }

  run(build: () => void): void {
    if (!this.allowed) {
      return;
    }
    this.revert();
    this.ctx = gsap.context(build, this.host);
  }

  /** Scroll-triggered reveal using the shared motion vocabulary. */
  reveal(targets: gsap.TweenTarget, variant: RevealVariant = 'rise', options: ScrollTrigger.Vars = {}): void {
    if (!this.allowed) {
      return;
    }
    this.run(() => {
      gsap.from(targets, {
        ...VARIANTS[variant],
        duration: 0.72,
        ease: 'power3.out',
        scrollTrigger: {
          start: 'top 88%',
          once: true,
          ...options,
        },
      });
    });
  }

  revert(): void {
    this.ctx?.revert();
    this.ctx = null;
  }
}

/** Convenience: run `fn` once the view has been rendered. */
export function afterRender(fn: () => void): void {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => requestAnimationFrame(fn));
  } else {
    fn();
  }
}

/** Registers a teardown callback with Angular's destroy lifecycle. */
export function onDestroy(ref: DestroyRef, teardown: () => void): void {
  ref.onDestroy(teardown);
}

/** Resolves after the next animation frame (twice, for layout stability). */
export function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== 'function') {
      resolve();
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/** Small helper so components can inject their own element ergonomically. */
export function hostElement(ref: ElementRef<HTMLElement>): HTMLElement {
  return ref.nativeElement;
}
