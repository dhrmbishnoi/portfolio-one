import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  inject,
} from '@angular/core';
import { gsap } from 'gsap';
import { MotionService, nextFrame } from '../../../core/services/motion.service';

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
    body: 'Ship the smallest honest version of the interface, with the accessibility contract in it.',
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
 * A horizontal editorial lifecycle rather than a five-card process. The
 * connecting rule draws itself on scroll; each stage carries one sentence and
 * nothing else.
 */
@Component({
  selector: 'app-method',
  standalone: true,
  templateUrl: './method.component.html',
  styleUrl: './method.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Method implements OnDestroy {
  protected readonly stages = STAGES;

  private readonly host: HTMLElement = inject(ElementRef).nativeElement as HTMLElement;
  private readonly motion = inject(MotionService);
  private readonly scope = this.motion.scope(inject(ElementRef).nativeElement as HTMLElement);

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
      const line = root.querySelector<HTMLElement>('[data-method-line]');

      if (line) {
        gsap.from(line, {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 1.1,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: root, start: 'top 78%', once: true },
        });
      }

      gsap.from(root.querySelectorAll('[data-method-stage]'), {
        opacity: 0,
        y: 14,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.07,
        scrollTrigger: { trigger: root, start: 'top 76%', once: true },
      });
    });
  }
}
