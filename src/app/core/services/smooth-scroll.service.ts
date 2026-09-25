import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { MotionService } from './motion.service';

gsap.registerPlugin(ScrollTrigger);

/**
 * SMOOTH SCROLL SERVICE
 * ---------------------------------------------------------------------------
 * Wraps Lenis so the whole document moves with inertia, and — crucially —
 * drives GSAP's ScrollTrigger from the same ticker. Without that handshake the
 * pinned chapters and scrubbed timelines would desynchronise from the visual
 * scroll position, which is the classic "smooth scroll breaks ScrollTrigger"
 * bug.
 *
 * Reduced motion opts out completely: Lenis is never constructed, native
 * scrolling is used, and every ScrollTrigger still works because it reads the
 * real scroll position.
 */
export type ScrollFrameListener = (progress: number, direction: 1 | -1) => void;

@Injectable({ providedIn: 'root' })
export class SmoothScrollService {
  private readonly motion = inject(MotionService);
  private readonly destroyRef = inject(DestroyRef);

  private lenis: Lenis | null = null;
  private tickerAttached = false;
  private readonly tick = (time: number): void => this.lenis?.raf(time * 1000);

  /** Document scroll progress, 0 → 1. Updated outside Angular's zone. */
  readonly progress = signal(0);
  /** Scroll direction, used by the header to retreat on the way down. */
  readonly direction = signal<1 | -1>(1);
  readonly ready = signal(false);

  /** Imperative listeners — for chrome that must not trigger change detection. */
  private readonly frameListeners = new Set<ScrollFrameListener>();

  private readonly onScroll = (event: { progress: number; direction: number }): void => {
    this.progress.set(event.progress);
    this.direction.set(event.direction >= 0 ? 1 : -1);
    this.frameListeners.forEach((listener) => listener(event.progress, event.direction >= 0 ? 1 : -1));
  };

  /**
   * Subscribe to raw scroll frames. Returns an unsubscribe function. Prefer this
   * over the signals for anything that repaints every frame (progress bars,
   * parallax chrome) — updating a signal per frame would re-render components.
   */
  onFrame(listener: ScrollFrameListener): () => void {
    this.frameListeners.add(listener);
    return () => this.frameListeners.delete(listener);
  }

  initialise(): void {
    if (this.lenis || typeof window === 'undefined') {
      return;
    }

    // Reduced motion opts out of inertia entirely, and so does any environment
    // that cannot support Lenis (no ResizeObserver — prerender, jsdom, or a very
    // old engine). Progress tracking still works in both cases.
    if (!this.motion.motionAllowed() || typeof ResizeObserver === 'undefined') {
      this.attachNativeProgress();
      return;
    }

    this.lenis = new Lenis({
      duration: 1.15,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.6,
      smoothWheel: true,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      autoRaf: false,
    });

    this.lenis.on('scroll', this.onScroll);
    this.lenis.on('scroll', ScrollTrigger.update);

    if (!this.tickerAttached) {
      gsap.ticker.add(this.tick);
      gsap.ticker.lagSmoothing(0);
      this.tickerAttached = true;
    }

    // Fonts and the WebGL boot shift layout; re-measure once they settle.
    void document.fonts?.ready.then(() => ScrollTrigger.refresh());
    ScrollTrigger.refresh();
    this.ready.set(true);

    this.destroyRef.onDestroy(() => this.destroy());
  }

  /** Smoothly scroll to an element, a position, or a named anchor. */
  scrollTo(target: string | HTMLElement | number, offset = 0): void {
    if (!this.lenis) {
      const element =
        typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
      if (typeof element === 'number') {
        window.scrollTo({ top: element, behavior: 'smooth' });
      } else {
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    this.lenis.scrollTo(target, { offset, duration: 1.4 });
  }

  /** Freeze the document — used while the mobile menu panel is open. */
  stop(): void {
    this.lenis?.stop();
  }

  start(): void {
    this.lenis?.start();
  }

  resize(): void {
    this.lenis?.resize();
  }

  destroy(): void {
    if (this.tickerAttached) {
      gsap.ticker.remove(this.tick);
      this.tickerAttached = false;
    }
    this.lenis?.destroy();
    this.lenis = null;
    ScrollTrigger.refresh();
  }

  private attachNativeProgress(): void {
    const update = (): void => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const value = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      const direction = value >= this.progress() ? 1 : -1;
      this.progress.set(value);
      this.direction.set(direction);
      this.frameListeners.forEach((listener) => listener(value, direction));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    this.destroyRef.onDestroy(() => window.removeEventListener('scroll', update));
    this.ready.set(true);
  }
}
