import {
  Directive,
  ElementRef,
  afterNextRender,
  inject,
  input,
  type OnDestroy,
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionService } from '../../core/services/motion.service';
import { splitText, type SplitMode, type SplitResult } from '../../core/motion/text-split';

export type RevealType =
  | 'rise'
  | 'fade'
  | 'mask'
  | 'scale'
  | 'blur'
  | 'lines'
  | 'words'
  | 'chars'
  | 'children';

export interface RevealOptions {
  readonly type?: RevealType;
  /** `load` fires on mount (heroes); `scroll` waits for the viewport. */
  readonly trigger?: 'scroll' | 'load';
  readonly stagger?: number;
  readonly delay?: number;
  readonly duration?: number;
  readonly distance?: number;
  /** ScrollTrigger start position for `scroll` reveals. */
  readonly start?: string;
  /** Replay every time the element re-enters the viewport. */
  readonly repeat?: boolean;
}

const FROM: Record<'rise' | 'fade' | 'mask' | 'scale' | 'blur' | 'children', gsap.TweenVars> = {
  rise: { y: 30, opacity: 0 },
  fade: { opacity: 0 },
  mask: { clipPath: 'inset(0 0 100% 0)', opacity: 0, y: 20 },
  scale: { scale: 0.93, opacity: 0, y: 26 },
  blur: { filter: 'blur(16px)', opacity: 0, y: 22 },
  children: { y: 34, opacity: 0 },
};

/**
 * REVEAL DIRECTIVE
 * ---------------------------------------------------------------------------
 * One declarative attribute covers the whole motion vocabulary of the site:
 *
 *   <h2 [appReveal]="'lines'">…</h2>
 *   <ul [appReveal]="{ type: 'children', stagger: 0.08 }">…</ul>
 *   <div [appReveal]="'blur'">…</div>
 *
 * Text-splitting modes (`lines`, `words`, `chars`) fragment the element with
 * accessible, reversible spans. Under reduced motion — or before hydration —
 * the directive does nothing at all and the content is simply there, which is
 * why the stylesheet's hidden states are gated behind `[data-motion='ready']`.
 */
@Directive({ selector: '[appReveal]' })
export class RevealDirective implements OnDestroy {
  /** Bare (`appReveal`) or configured (`[appReveal]="'lines'"`). */
  readonly appReveal = input<RevealType | RevealOptions | ''>('');

  private readonly host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly motion = inject(MotionService);
  private animation: gsap.core.Tween | null = null;
  private trigger: ScrollTrigger | null = null;
  private split: SplitResult | null = null;

  constructor() {
    if (!this.motion.motionAllowed()) {
      return;
    }

    const options = normalise(this.appReveal());

    // Hide synchronously, before the first paint, so the element never flashes
    // in its final state before the reveal is built. The tween restores it.
    this.host.style.opacity = '0';

    afterNextRender(() => this.play(options));
  }

  ngOnDestroy(): void {
    this.trigger?.kill();
    this.animation?.kill();
    this.split?.revert();
    this.host.style.removeProperty('opacity');
    this.host.style.removeProperty('transform');
  }

  private play(options: RevealOptions): void {
    if (!this.motion.motionAllowed()) {
      this.host.style.removeProperty('opacity');
      return;
    }

    const type = options.type ?? 'rise';
    const duration = options.duration ?? 0.9;
    const isSplit = type === 'lines' || type === 'words' || type === 'chars';

    try {
      if (isSplit) {
        this.split = splitText(this.host, type as SplitMode);
      }
    } catch {
      // Splitting is an enhancement: if it fails, show the text as authored
      // rather than leaving it masked.
      this.split?.revert();
      this.split = null;
      this.host.style.removeProperty('opacity');
      return;
    }

    const targets: gsap.TweenTarget = isSplit
      ? this.split!.targets
      : type === 'children'
        ? Array.from(this.host.children)
        : this.host;

    const from = resolveFrom(type, options);
    const stagger = options.stagger ?? (isSplit ? 0.075 : 0.09);
    const delay = options.delay ?? (options.trigger === 'load' ? 0.12 : 0);

    this.host.style.removeProperty('opacity');

    try {
      // Hold the from-state now rather than at the moment the trigger fires:
      // otherwise an element already touching the viewport paints its final
      // state for a frame, snaps back, and animates in again.
      gsap.set(targets, from);

      const animation = gsap.fromTo(targets, from, {
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
        filter: 'blur(0px)',
        clipPath: 'inset(0 0 0% 0)',
        duration,
        delay,
        stagger: isSplit ? { each: stagger, from: 'start' } : stagger,
        ease: isSplit ? 'expo.out' : 'power3.out',
        overwrite: 'auto',
        paused: true,
      });
      this.animation = animation;

      if (options.trigger === 'load') {
        animation.play();
        return;
      }

      this.trigger = ScrollTrigger.create({
        trigger: this.host,
        start: options.start ?? 'top 88%',
        once: !options.repeat,
        onEnter: () => animation.restart(true),
        onEnterBack: options.repeat ? () => animation.restart(true) : undefined,
      });
    } catch {
      this.animation?.kill();
      this.split?.revert();
      this.split = null;
      this.host.style.removeProperty('opacity');
    }
  }
}

function resolveFrom(type: RevealType, options: RevealOptions): gsap.TweenVars {
  switch (type) {
    case 'lines':
      return { yPercent: 118, opacity: 0 };
    case 'words':
      return { yPercent: 110, opacity: 0 };
    case 'chars':
      return { yPercent: 100, opacity: 0, rotateX: -60, transformPerspective: 600 };
    case 'children':
      return { y: options.distance ?? 34, opacity: 0 };
    default:
      return { ...FROM[type] };
  }
}

function normalise(input: RevealType | RevealOptions | ''): RevealOptions {
  if (input === '') {
    return { type: 'rise' };
  }
  return typeof input === 'string' ? { type: input } : input;
}
