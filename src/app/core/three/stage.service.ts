import { Injectable, signal } from '@angular/core';
import { DEFAULT_PARAMS, type StageParams } from './artifact';

export type StageQuality = 'high' | 'balanced' | 'off';

/**
 * STAGE SERVICE
 * ---------------------------------------------------------------------------
 * The shared pose that every section of the home narrative writes to. It is a
 * *plain object*, not a signal, on purpose: ScrollTrigger tweens it on every
 * scrolled frame, and a signal write per frame would drag the whole page
 * through change detection for a value only the render loop reads.
 *
 * Sections therefore describe the pose they want and let the damped follow in
 * the artifact do the easing:
 *
 *     gsap.to(stage.params, { x: -0.42, scale: 0.7, ease: 'none', scrollTrigger });
 *
 * Reads that *should* reach Angular — whether WebGL is live, the frame rate, the
 * current chapter — are signals.
 */
@Injectable({ providedIn: 'root' })
export class StageService {
  /** Live pose, tweened by ScrollTrigger and read by the render loop. */
  readonly params: StageParams = { ...DEFAULT_PARAMS };

  /** True once the artifact has painted at least one frame. */
  readonly live = signal(false);

  /** Measured frame rate, exposed for the diagnostic readout in the loader. */
  readonly fps = signal(60);

  /**
   * Whether the stage is allowed to run at all. Resolved once, at startup, from
   * the device — a WebGL-less browser, a low-memory phone and a reduced-motion
   * preference all land here.
   */
  readonly quality: StageQuality = detectQuality();

  readonly enabled = this.quality !== 'off';

  /** Blend the pose toward a set of values — used for the resting state. */
  apply(patch: Partial<StageParams>): void {
    Object.assign(this.params, patch);
  }

  /** Return the artifact to rest, e.g. after leaving the narrative. */
  reset(): void {
    Object.assign(this.params, DEFAULT_PARAMS);
  }
}

function detectQuality(): StageQuality {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 'off';
  }
  if (!supportsWebGL()) {
    return 'off';
  }

  // `deviceMemory` is Chromium-only; treat a missing value as "unknown", not
  // as "low", so Safari and Firefox are not punished for a missing API.
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency ?? 4;
  const coarse = window.matchMedia?.('(hover: none)')?.matches ?? false;

  if (coarse || cores <= 4 || (memory !== undefined && memory <= 4)) {
    return 'balanced';
  }
  return 'high';
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const context =
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl');
    return Boolean(context);
  } catch {
    return false;
  }
}
