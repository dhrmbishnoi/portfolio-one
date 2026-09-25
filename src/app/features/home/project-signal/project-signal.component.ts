import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { SIGNAL_VISUALS, type VitalTrace } from '../../../core/data/projects.data';
import { MotionService, nextFrame } from '../../../core/services/motion.service';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { TiltDirective } from '../../../shared/directives/tilt.directive';

/**
 * PROJECT 03 — SIGNAL
 * ---------------------------------------------------------------------------
 * Light editorial layout for an engineering tool. Traces are SVG paths that
 * draw in on reveal; the waterfall and bundle map are generated from the same
 * normalised series. No charting library, no dashboard chrome.
 */
@Component({
  selector: 'app-project-signal',
  standalone: true,
  imports: [RouterLink, RevealDirective, TiltDirective],
  templateUrl: './project-signal.component.html',
  styleUrl: './project-signal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSignal implements OnDestroy {
  private readonly host: HTMLElement = inject(ElementRef).nativeElement as HTMLElement;
  private readonly motion = inject(MotionService);
  private readonly scope = this.motion.scope(inject(ElementRef).nativeElement as HTMLElement);

  protected readonly project = {
    index: '03',
    title: 'Signal',
    subtitle: 'Observability interface for frontend performance and runtime health.',
    year: '2023',
    role: 'Frontend engineer — visualisation and data pipeline',
    focus: ['Performance', 'Telemetry', 'Visualisation', 'Frontend systems'],
    problem:
      'Frontend performance was discussed in anecdotes. Nobody could say which route regressed, which interaction got slower, or whether the last release actually helped.',
    built:
      'An observability surface: web-vitals traces, a request waterfall, a bundle map, per-route budgets and a runtime error feed — all rendered from one telemetry pipeline.',
    technicalFocus: [
      'Traces rendered as SVG paths with a draw-in reveal',
      'Budgets read from the same config that CI asserts',
      'Bundle composition derived from the build manifest',
      'Error states modelled as data, never as red text',
    ],
  };

  protected readonly visuals = SIGNAL_VISUALS;

  protected readonly traces = computed(() =>
    this.visuals.traces.map((trace) => ({ ...trace, path: buildPath(trace.points) })),
  );

  protected readonly bundleTotal = computed(() =>
    this.visuals.bundle.reduce((sum, part) => sum + part.bytes, 0),
  );

  protected readonly waterfallScale = computed(() => {
    const max = Math.max(...this.visuals.waterfall.map((row) => row.start + row.duration));
    return 100 / max;
  });

  protected bundlePercent(bytes: number): number {
    return (bytes / this.bundleTotal()) * 100;
  }

  protected formatBytes(bytes: number): string {
    return `${Math.round(bytes / 1024)}kB`;
  }

  protected traceRating(trace: VitalTrace): string {
    return trace.rating === 'good' ? 'Good' : 'Needs improvement';
  }

  /** Y position of the budget rule inside the 54-unit-tall trace viewBox. */
  protected budgetY(trace: VitalTrace): number {
    const max = Math.max(...trace.points);
    const min = Math.min(...trace.points);
    const span = max - min || 1;
    const normalised = (trace.budget - min) / span;
    return Math.min(50, Math.max(8, 48 - normalised * 44));
  }

  constructor() {
    afterNextRender(() => void this.reveal());
  }

  ngOnDestroy(): void {
    this.scope.revert();
  }

  private async reveal(): Promise<void> {
    if (!this.motion.motionAllowed()) {
      return;
    }

    await nextFrame();
    this.scope.run(() => {
      const root = this.host;

      // Performance lines draw themselves in; bars settle; the bundle map
      // segments widen from the left.
      root.querySelectorAll<SVGPathElement>('[data-signal-path]').forEach((path) => {
        // `getTotalLength` is an SVG geometry API that some environments (and
        // every non-geometry SVG element) do not implement — the draw-in is an
        // enhancement, so it is simply skipped when the measurement is missing.
        if (typeof path.getTotalLength !== 'function') {
          return;
        }
        const length = path.getTotalLength();
        gsap.from(path, {
          strokeDasharray: length,
          strokeDashoffset: length,
          duration: 1.1,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: path.closest('[data-signal-panel]') ?? root, start: 'top 82%', once: true },
        });
      });

      gsap.from(root.querySelectorAll('[data-signal-bar]'), {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.05,
        scrollTrigger: { trigger: root, start: 'top 76%', once: true },
      });

      gsap.from(root.querySelectorAll('[data-signal-segment]'), {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.06,
        scrollTrigger: { trigger: root, start: 'top 70%', once: true },
      });
    });
  }
}

/** Builds an SVG polyline path from a series of values. */
function buildPath(points: readonly number[]): string {
  const width = 260;
  const height = 54;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;

  return points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 8) - 4;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}
