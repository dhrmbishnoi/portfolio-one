import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import { gsap } from 'gsap';
import type * as THREE_NS from 'three';
import { MotionService } from '../services/motion.service';
import { DEFAULT_PARAMS, type ArtifactHandle, type PointerState, type StageParams } from './artifact';
import { StageService } from './stage.service';

/**
 * SCENE STAGE
 * ---------------------------------------------------------------------------
 * One fixed WebGL canvas behind the entire home narrative. Because the artifact
 * is one object that every section re-poses, it reads as a single continuous
 * thing travelling with the reader, rather than a sequence of unrelated
 * effects. Sections stay free of any three.js knowledge — they only write to
 * `StageService.params`.
 *
 * The guard rails matter more than the effect, so all of them are explicit:
 *
 *   · three.js is imported lazily — it is never part of the initial bundle.
 *   · The loop stops when the tab is hidden, and the whole stage is skipped
 *     when WebGL is unavailable, the device is weak, or the reader prefers
 *     reduced motion. A CSS fallback then stands in.
 *   · The frame rate is measured; sustained slowness drops the pixel ratio
 *     rather than the frame rate.
 *   · The canvas is `aria-hidden` and `pointer-events: none`: decoration only,
 *     and the page underneath is fully operable without it.
 */
@Component({
  selector: 'app-scene-stage',
  standalone: true,
  template: `
    <div class="stage">
      <div class="stage__wash" aria-hidden="true"></div>

      <canvas #canvas class="stage__canvas" aria-hidden="true"></canvas>

      <!-- Stand-in for every environment that cannot run WebGL. -->
      <div class="stage__fallback" aria-hidden="true">
        <span class="stage__orb stage__orb--iris"></span>
        <span class="stage__orb stage__orb--aqua"></span>
        <span class="stage__orb stage__orb--accent"></span>
      </div>
    </div>
  `,
  styleUrl: './scene-stage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneStage {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly stage = inject(StageService);
  private readonly motion = inject(MotionService);
  private readonly destroyRef = inject(DestroyRef);

  private three: typeof THREE_NS | null = null;
  private renderer: THREE_NS.WebGLRenderer | null = null;
  private scene: THREE_NS.Scene | null = null;
  private camera: THREE_NS.PerspectiveCamera | null = null;
  private artifact: ArtifactHandle | null = null;

  private frame = 0;
  private last = 0;
  private elapsed = 0;
  private frames = 0;
  private fpsWindow = 0;
  private slowFrames = 0;
  private qualityStep = 0;

  private readonly pointer: PointerState = { x: 0, y: 0 };
  private readonly pointerTarget: PointerState = { x: 0, y: 0 };

  private arrival: gsap.core.Tween | null = null;
  private running = false;
  private destroyed = false;

  constructor() {
    afterNextRender(() => {
      if (!this.stage.enabled) {
        this.host.dataset['stage'] = 'fallback';
        return;
      }
      void this.boot();
    });

    const onPointerMove = (event: PointerEvent): void => {
      this.pointerTarget.x = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      this.pointerTarget.y = (event.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
    };
    const onVisibility = (): void => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    };

    // The pointer is only worth tracking when it can actually move the object.
    if (this.stage.enabled && this.motion.motionAllowed()) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    }
    document.addEventListener('visibilitychange', onVisibility);

    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
      this.arrival?.kill();
      this.pause();
      this.artifact?.dispose();
      this.renderer?.dispose();
      this.renderer = null;
      this.host.dataset['stage'] = 'idle';
      this.stage.reset();
      this.stage.live.set(false);
    });
  }

  /**
   * Anything past the capability probe is best-effort. A refused context, a
   * driver reset or a changed API must still leave a working page behind.
   */
  private async boot(): Promise<void> {
    try {
      await this.start();
    } catch {
      this.fallback();
    }
  }

  private fallback(): void {
    this.pause();
    this.artifact?.dispose();
    this.artifact = null;
    this.renderer?.dispose();
    this.renderer = null;
    this.stage.live.set(false);
    this.host.dataset['stage'] = 'fallback';
  }

  private async start(): Promise<void> {
    const THREE = await import('three');
    const { createArtifact } = await import('./artifact');
    if (this.destroyed) {
      return;
    }
    this.three = THREE;

    const canvas = this.canvasRef().nativeElement;
    const high = this.stage.quality === 'high';

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: high,
      powerPreference: high ? 'high-performance' : 'default',
      depth: true,
      stencil: false,
    });
    renderer.setClearAlpha(0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // The shaders are authored to land where they land: no tone curve is
    // applied, so the accent colours stay exactly on brand.
    renderer.toneMapping = THREE.NoToneMapping;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    const colors = readAccentColors(THREE);

    const artifact = createArtifact(THREE, { lowPower: !high, colors });

    if (this.destroyed) {
      artifact.dispose();
      renderer.dispose();
      return;
    }

    scene.add(artifact.group);

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.artifact = artifact;

    this.resize();
    this.host.dataset['stage'] = 'live';

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => this.resize());
      observer.observe(document.documentElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    } else {
      // jsdom and very old browsers: never depend on an observer existing.
      const onResize = (): void => this.resize();
      window.addEventListener('resize', onResize);
      this.destroyRef.onDestroy(() => window.removeEventListener('resize', onResize));
    }

    const onContextLost = (event: Event): void => {
      event.preventDefault();
      this.fallback();
    };
    canvas.addEventListener('webglcontextlost', onContextLost);
    this.destroyRef.onDestroy(() => canvas.removeEventListener('webglcontextlost', onContextLost));

    // First frame is painted synchronously so the artifact is never a blank
    // rectangle waiting for a tick.
    this.render(0, 0);
    this.stage.live.set(true);

    // Reduced motion: the object is still there, at rest, with no loop.
    if (this.motion.motionAllowed()) {
      this.resume();
      this.arrive();
    }
  }

  /**
   * The arrival: the artifact condenses out of the stage into whatever pose the
   * opening section has already asked for. This is the one piece of
   * choreography that belongs to the *page* rather than to a scroll position —
   * without it the object is simply present when the first frame paints, which
   * reads as a still image rather than a thing that can move.
   *
   * Two guards keep it honest: it never runs if the reader has already scrolled
   * (a restored deep link lands mid-story), and the first wheel or touch lands
   * it instantly so nobody is left fighting an intro they cannot see.
   */
  private arrive(): void {
    if (typeof window === 'undefined' || window.scrollY > 24) {
      return;
    }

    const resting = { ...this.stage.params };
    this.arrival = gsap.fromTo(
      this.stage.params,
      {
        ...DEFAULT_PARAMS,
        scale: 0.58,
        energy: 1.15,
        wire: 0,
        glow: 0.9,
        spread: 0.08,
        twist: -0.5,
        opacity: 0,
      },
      {
        ...resting,
        duration: 1.75,
        delay: 0.08,
        ease: 'expo.out',
        onComplete: () => {
          this.arrival = null;
        },
      },
    );

    const land = (): void => {
      if (!this.arrival) {
        return;
      }
      // Land on the final pose rather than leaving the artifact mid-arrival for
      // the scroll timeline to argue with.
      this.arrival.progress(1);
      this.arrival.kill();
      this.arrival = null;
    };

    window.addEventListener('wheel', land, { passive: true, once: true });
    window.addEventListener('touchstart', land, { passive: true, once: true });
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('wheel', land);
      window.removeEventListener('touchstart', land);
    });
  }

  private resize(): void {
    if (!this.renderer || !this.camera) {
      return;
    }
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    const cap = this.stage.quality === 'high' ? 2 : 1.5;

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private readonly tick = (time: number): void => {
    if (!this.running) {
      return;
    }
    this.frame = requestAnimationFrame(this.tick);

    const delta = this.last === 0 ? 16.7 : Math.min(64, time - this.last);
    this.last = time;
    this.elapsed += delta / 1000;

    this.render(this.elapsed, delta);
    this.measure(delta);
  };

  private render(elapsed: number, delta: number): void {
    const { renderer, scene, camera, artifact } = this;
    if (!renderer || !scene || !camera || !artifact) {
      return;
    }

    // The pointer only nudges the object; the scroll owns the pose.
    this.pointer.x += (this.pointerTarget.x - this.pointer.x) * 0.06;
    this.pointer.y += (this.pointerTarget.y - this.pointer.y) * 0.06;

    camera.position.x = this.pointer.x * 0.26;
    camera.position.y = -this.pointer.y * 0.18 + Math.sin(elapsed * 0.16) * 0.05;
    camera.lookAt(0, 0, 0);

    artifact.update(elapsed, delta, this.stage.params, this.pointer, camera.aspect);
    renderer.render(scene, camera);
  }

  /**
   * Sustained slowness is answered with fewer pixels, not fewer frames — a
   * softer artifact at 60fps beats a crisp one at 30. Two steps, then it is
   * accepted as-is.
   */
  private measure(delta: number): void {
    this.frames += 1;
    this.fpsWindow += delta;

    if (this.fpsWindow < 1000) {
      return;
    }

    const fps = Math.round((this.frames * 1000) / this.fpsWindow);
    this.frames = 0;
    this.fpsWindow = 0;
    this.stage.fps.set(fps);

    if (fps >= 48 || !this.renderer || this.qualityStep >= 2) {
      this.slowFrames = 0;
      return;
    }

    this.slowFrames += 1;
    if (this.slowFrames < 2) {
      return;
    }

    this.slowFrames = 0;
    this.qualityStep += 1;
    const caps = [1.5, 1.15, 1];
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, caps[this.qualityStep]!));
    this.renderer.setSize(Math.max(1, window.innerWidth), Math.max(1, window.innerHeight), false);
  }

  private pause(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  private resume(): void {
    if (this.running || this.destroyed || !this.renderer) {
      return;
    }
    this.running = true;
    this.last = 0;
    this.frame = requestAnimationFrame(this.tick);
  }
}

/**
 * Read the accent tokens straight from the document so the artifact and the CSS
 * can never drift apart, with the same values hard-coded as a fallback for the
 * (unlikely) case where the token cannot be resolved.
 */
function readAccentColors(THREE_: typeof THREE_NS): {
  a: THREE_NS.Color;
  b: THREE_NS.Color;
  c: THREE_NS.Color;
} {
  const read = (token: string, fallback: string): THREE_NS.Color => {
    let value = '';
    try {
      value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    } catch {
      value = '';
    }
    try {
      return new THREE_.Color(value || fallback);
    } catch {
      return new THREE_.Color(fallback);
    }
  };

  return {
    a: read('--accent-2', '#7c5cff'),
    b: read('--accent', '#d7ff4f'),
    c: read('--accent-3', '#37e8d5'),
  };
}

/** Re-exported so consumers can type a pose without importing three.js. */
export type { StageParams };
