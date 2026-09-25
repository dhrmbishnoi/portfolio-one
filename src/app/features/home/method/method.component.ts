import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { gsap } from 'gsap';
import { MotionService } from '../../../core/services/motion.service';
import { StageService } from '../../../core/three/stage.service';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

const STAGES = [
  {
    id: 'understand',
    title: 'Understand',
    body: 'Spend longer than feels comfortable on the problem before touching the solution.',
  },
  {
    id: 'model',
    title: 'Model',
    body: 'Name the entities, decide who owns each piece of state, and draw the boundaries.',
  },
  {
    id: 'build',
    title: 'Build',
    body: 'Ship the smallest honest version of the interface, with the accessibility contract inside it.',
  },
  {
    id: 'stress-test',
    title: 'Stress-test',
    body: 'Put real data, real latency and a keyboard in front of it, then measure what happens.',
  },
  {
    id: 'ship',
    title: 'Ship',
    body: 'Leave the codebase easier to read than you found it, and write down what you learned.',
  },
] as const;

/**
 * WORKING METHOD
 * ---------------------------------------------------------------------------
 * The lifecycle as a pinned horizontal track: the five stages travel sideways
 * while the section holds still, so the reader experiences the method as a
 * sequence rather than a list. The artifact drops back to a wireframe blueprint
 * underneath — the drawing on the desk while the stages move across it.
 *
 * Below the tablet breakpoint, or under reduced motion, the same markup becomes
 * a horizontal snap-scroller the reader drives with their thumb.
 */
@Component({
  selector: 'app-method',
  standalone: true,
  imports: [RevealDirective],
  templateUrl: './method.component.html',
  styleUrl: './method.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Method implements OnDestroy {
  protected readonly stages = STAGES;
  protected readonly progress = signal(0);
  protected readonly activeStage = signal(1);

  private readonly host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly motion = inject(MotionService);
  private readonly stage = inject(StageService);
  private readonly scope = this.motion.scope(this.host);

  constructor() {
    afterNextRender(() => this.play());
  }

  ngOnDestroy(): void {
    this.scope.revert();
    this.section?.classList.remove('method--motion');
  }

  /** See Story: the register class must live on an encapsulated template node. */
  private get section(): HTMLElement | null {
    return this.host.querySelector<HTMLElement>('.method');
  }

  private play(): void {
    if (!this.motion.motionAllowed() || window.innerWidth < 900) {
      return;
    }

    const pin = this.host.querySelector<HTMLElement>('[data-method-pin]');
    const track = this.host.querySelector<HTMLElement>('[data-method-track]');
    const viewport = this.host.querySelector<HTMLElement>('[data-method-viewport]');
    const head = this.host.querySelector<HTMLElement>('[data-method-head]');
    const stages = Array.from(this.host.querySelectorAll<HTMLElement>('[data-method-stage]'));
    if (!pin || !track || !viewport || !stages.length) {
      return;
    }

    /** How far the track has to travel to show its last stage. */
    const distance = (): number => Math.max(0, track.scrollWidth - viewport.clientWidth);

    const section = this.section;
    if (!section) {
      return;
    }

    this.scope.run(() => {
      section.classList.add('method--motion');

      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: this.host,
          start: 'top top',
          end: () => `+=${distance() * 1.15 + window.innerHeight * 0.35}`,
          scrub: 0.6,
          pin,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            this.progress.set(Number(self.progress.toFixed(3)));
            const index = Math.min(
              stages.length,
              Math.max(1, Math.round(self.progress * (stages.length - 1)) + 1),
            );
            if (index !== this.activeStage()) {
              this.activeStage.set(index);
            }
          },
        },
      });

      // One unit of the timeline per stage transition, so a stage's "arrival"
      // always coincides with its arrival at the centre of the viewport.
      const total = stages.length - 1 + 0.1;

      timeline
        .to(track, { x: () => -distance(), duration: total }, 0)
        .to(head, { yPercent: -6, opacity: 0.5, duration: total }, 0)
        .to(
          this.stage.params,
          {
            x: 0.1,
            y: -0.12,
            scale: 1.24,
            energy: 0.16,
            wire: 0.9,
            glow: 0.42,
            spin: 0.5,
            opacity: 0.42,
            spread: 1.35,
            duration: total,
          },
          0,
        );

      gsap.set(stages, { opacity: 0.38, scale: 0.975, transformOrigin: 'left center' });
      stages.forEach((element, index) => {
        const at = Math.max(0, index - 0.45);
        timeline.to(element, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }, at);
        const previous = stages[index - 1];
        if (previous) {
          timeline.to(previous, { opacity: 0.38, scale: 0.975, duration: 0.5 }, at);
        }
      });
    });
  }
}
