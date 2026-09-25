import { Injectable, signal } from '@angular/core';
import { nextFrame } from './motion.service';

export type BootstrapState = 'idle' | 'initialising' | 'ready';

const SHOW_AFTER_MS = 120;

/**
 * BOOTSTRAP SERVICE
 * ---------------------------------------------------------------------------
 * The technical loader is shown only when the app genuinely needs
 * initialisation time — waiting for the self-hosted font faces to settle and
 * for the first painted frame. If that finishes inside 120ms the loader is
 * never shown, so there is no artificial delay and no flash on warm loads.
 */
@Injectable({ providedIn: 'root' })
export class BootstrapService {
  readonly state = signal<BootstrapState>('idle');
  /** 0–1, drives the thin progress line in the loader. */
  readonly progress = signal(0);

  async initialise(): Promise<void> {
    if (this.state() !== 'idle') {
      return;
    }

    const fontsReady: Promise<unknown> =
      typeof document !== 'undefined' && 'fonts' in document
        ? document.fonts.ready.catch(() => undefined)
        : Promise.resolve();

    const initialised = Promise.all([fontsReady, nextFrame()]).then(() => 'ready' as const);
    const threshold = delay(SHOW_AFTER_MS).then(() => 'threshold' as const);

    this.progress.set(0.15);

    const outcome = await Promise.race([threshold, initialised]);

    if (outcome === 'threshold') {
      this.state.set('initialising');
      this.progress.set(0.6);
      await initialised;
    }

    this.progress.set(1);
    this.state.set('ready');
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
