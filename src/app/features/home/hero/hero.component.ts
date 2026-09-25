import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { SITE } from '../../../core/config/site.config';
import { MotionService } from '../../../core/services/motion.service';
import { StageService } from '../../../core/three/stage.service';
import { MagneticDirective } from '../../../shared/directives/magnetic.directive';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { TiltDirective } from '../../../shared/directives/tilt.directive';

interface Metric {
  readonly label: string;
  readonly value: string;
  readonly note: string;
  /** Fill ratio of the instrument bar, 0 → 1. */
  readonly fill: number;
}

/**
 * HERO
 * ---------------------------------------------------------------------------
 * The opening frame of the scroll story. Three layers:
 *
 *   1. Kinetic typography — the headline splits into masked lines and rises.
 *   2. The artifact — a WebGL object anchored to the empty right half, held by
 *      the stage service and nudged by the pointer.
 *   3. Instrumentation — a glass panel of real frontend benchmarks, because the
 *      claim on the page is that this work is measured.
 *
 * As the reader scrolls away, the artifact is handed to the next chapter: it
 * lifts, brightens and drifts right, so the object never cuts, it travels.
 */
@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink, RevealDirective, MagneticDirective, TiltDirective],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero implements OnDestroy {
  private readonly host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly motion = inject(MotionService);
  private readonly stage = inject(StageService);
  private readonly scope = this.motion.scope(this.host);

  protected readonly site = SITE;
  protected readonly eyebrow = 'Senior frontend / product engineer';

  protected readonly titleReveal = {
    type: 'lines' as const,
    trigger: 'load' as const,
    delay: 0.12,
    stagger: 0.11,
  };

  protected readonly copyReveal = {
    type: 'blur' as const,
    trigger: 'load' as const,
    delay: 0.55,
  };

  protected readonly metrics: readonly Metric[] = [
    { label: 'LCP · p75', value: '1.1s', note: 'field data, 4G', fill: 0.22 },
    { label: 'JS shipped', value: '82kB', note: 'gzip, route-split', fill: 0.3 },
    { label: 'Interaction · p95', value: '46ms', note: 'budget 100ms', fill: 0.46 },
    { label: 'Accessibility', value: '100', note: 'audited, not assumed', fill: 1 },
  ];

  protected readonly ticker: readonly string[] = [
    ...SITE.technicalStack,
    'WEBGL',
    'MOTION DESIGN',
    'DESIGN TOKENS',
    'CORE WEB VITALS',
  ];

  constructor() {
    afterNextRender(() => this.play());
  }

  ngOnDestroy(): void {
    this.scope.revert();
  }

  private play(): void {
    if (!this.motion.motionAllowed()) {
      return;
    }

    this.scope.run(() => {
      // Instrument bars: drawn once, on load, from their real values.
      gsap.from('[data-hero-bar]', {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 1.2,
        delay: 1.1,
        stagger: 0.09,
        ease: 'expo.out',
      });
    });

    // Hand the artifact over to the story as the hero leaves the viewport.
    this.scope.scrub(
      this.host,
      (timeline) => {
        timeline.to(this.stage.params, {
          x: 0.24,
          y: 0.16,
          scale: 0.68,
          energy: 0.62,
          glow: 0.75,
          wire: 0.35,
          spin: 1.4,
          opacity: 0.9,
          ease: 'none',
        });
      },
      { start: 'top top', end: 'bottom top', scrub: 0.8 },
    );

    this.stage.apply({
      x: 0.56,
      y: 0.12,
      scale: 0.92,
      energy: 0.32,
      glow: 0.55,
      wire: 0.2,
      spin: 0.9,
      spread: 1,
      opacity: 1,
      twist: 0,
    });
  }
}
