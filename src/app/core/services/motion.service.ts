import { DestroyRef, ElementRef, inject, Injectable, signal } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Motion vocabulary — deliberately narrow. */
export type RevealVariant = 'rise' | 'fade' | 'line' | 'mask' | 'settle' | 'scale' | 'blur';

const VARIANTS: Record<RevealVariant, gsap.TweenVars> = {
  rise: { opacity: 0, y: 26 },
  fade: { opacity: 0 },
  line: { opacity: 0, scaleX: 0, transformOrigin: 'left center' },
  mask: { opacity: 0, clipPath: 'inset(0 0 100% 0)' },
  settle: { opacity: 0, y: 14, scale: 0.985 },
  scale: { opacity: 0, scale: 0.9, y: 22 },
  blur: { opacity: 0, filter: 'blur(14px)', y: 18 },
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
 *
 * It also publishes the `data-motion` flag on <html>, which is what unlocks the
 * stylesheet's "hide first, animate in" states. Without JavaScript the flag is
 * never set and every page renders fully visible and static.
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

  /** Pointer capability — drives cursor, tilt and magnetic hover. */
  readonly finePointer = ((): boolean => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    // A stubbed or unavailable query is treated as "no fine pointer": all three
    // effects are enhancements, and none of them should appear on a device that
    // cannot express hover.
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    return query?.matches ?? false;
  })();

  constructor() {
    this.applyFlag(this.motionAllowed());

    this.query?.addEventListener('change', (event) => {
      this._reduced.set(event.matches);
      this.motionAllowed.set(!event.matches);
      this.applyFlag(!event.matches);
      // Anything already on screen must not be left mid-animation.
      if (event.matches) {
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
        gsap.globalTimeline.clear();
        gsap.set('[data-reveal], [data-split], [data-parallax], [data-tilt]', {
          clearProps: 'all',
        });
      } else {
        ScrollTrigger.refresh();
      }
    });
  }

  /** Bind a reverting animation scope to a host element. */
  scope(host: HTMLElement): GsapScope {
    return new GsapScope(host, this.motionAllowed());
  }

  /** Re-measure every trigger after layout changes (fonts, images, WebGL). */
  refresh(): void {
    ScrollTrigger.refresh();
  }

  private applyFlag(allowed: boolean): void {
    if (typeof document === 'undefined') {
      return;
    }
    if (allowed) {
      document.documentElement.dataset['motion'] = 'ready';
    } else {
      delete document.documentElement.dataset['motion'];
    }
  }
}

/**
 * A GSAP context bound to one component. `run()` is a no-op when motion is not
 * allowed, which is what keeps the "no animation, final state" guarantee.
 */
export class GsapScope {
  private ctx: ReturnType<typeof gsap.context> | null = null;
  private triggers: ScrollTrigger[] = [];

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

  /** A timeline scoped to this host. */
  timeline(vars: gsap.TimelineVars = {}): gsap.core.Timeline | null {
    if (!this.allowed) {
      return null;
    }
    return gsap.timeline({ defaults: { ease: 'power3.out' }, ...vars });
  }

  /** Scroll-triggered reveal using the shared motion vocabulary. */
  reveal(
    targets: gsap.TweenTarget,
    variant: RevealVariant = 'rise',
    options: ScrollTrigger.Vars = {},
  ): void {
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

  /**
   * A scrubbed, pinned or free-running ScrollTrigger driven timeline. `build`
   * receives the timeline and the trigger, so callers can shape the tween with
   * values derived from their own layout.
   */
  scrub(
    trigger: gsap.DOMTarget,
    build: (timeline: gsap.core.Timeline, self: ScrollTrigger) => void,
    vars: ScrollTrigger.Vars = {},
  ): ScrollTrigger | null {
    if (!this.allowed) {
      return null;
    }
    const element = resolveTarget(trigger);
    if (!element) {
      return null;
    }

    let created: ScrollTrigger | null = null;

    this.run(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: element,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6,
          ...vars,
        },
      });
      const trigger = timeline.scrollTrigger ?? null;
      if (trigger) {
        this.triggers.push(trigger);
      }
      build(timeline, trigger as ScrollTrigger);
      created = trigger;
    });

    return created;
  }

  /**
   * Depth parallax: the target drifts by `distance` pixels across the trigger's
   * travel. Cheap, transform-only, and disabled on small screens where the
   * drift would break the reading measure.
   */
  parallax(
    targets: gsap.TweenTarget,
    distance = 90,
    vars: ScrollTrigger.Vars = {},
  ): void {
    if (!this.allowed) {
      return;
    }
    const enabled = typeof window !== 'undefined' ? window.innerWidth >= 768 : false;
    const element = resolveTarget(targets);
    if (!enabled || !element) {
      return;
    }
    this.run(() => {
      gsap.fromTo(
        targets,
        { yPercent: -distance / 20 },
        {
          yPercent: distance / 20,
          ease: 'none',
          scrollTrigger: {
            trigger: element,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.8,
            ...vars,
          },
        },
      );
    });
  }

  revert(): void {
    this.triggers.forEach((trigger) => trigger.kill());
    this.triggers = [];
    this.ctx?.revert();
    this.ctx = null;
  }
}

function resolveTarget(target: gsap.TweenTarget | gsap.DOMTarget): Element | null {
  if (typeof target === 'string') {
    return document.querySelector(target);
  }
  if (target instanceof Element) {
    return target;
  }
  if (Array.isArray(target) && target[0] instanceof Element) {
    return target[0];
  }
  return null;
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
