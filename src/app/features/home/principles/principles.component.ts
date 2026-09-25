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
import { RevealDirective } from '../../../shared/directives/reveal.directive';

const PRINCIPLES = [
  {
    id: 'predictable',
    title: 'Predictable systems',
    body: 'State has one owner and one writer. When something changes, there is exactly one place to look.',
  },
  {
    id: 'accessible',
    title: 'Accessible by default',
    body: 'Keyboard parity, names and announcements are specified with the component, not bolted on afterwards.',
  },
  {
    id: 'performance',
    title: 'Performance as a feature',
    body: 'Budgets are configuration. A regression fails the build before it reaches a user.',
  },
  {
    id: 'aligned',
    title: 'Design and engineering aligned',
    body: 'The interaction model is a design decision and an engineering decision at the same time.',
  },
] as const;

/**
 * ENGINEERING PRINCIPLES
 * ---------------------------------------------------------------------------
 * A strong dark editorial statement. Kept deliberately simple: one headline,
 * one supporting paragraph, four principles separated by hairlines.
 */
@Component({
  selector: 'app-principles',
  standalone: true,
  imports: [RevealDirective],
  templateUrl: './principles.component.html',
  styleUrl: './principles.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Closes the paper movement: the last daylight frame before the dark close.
  host: { class: 'on-paper' },
})
export class Principles implements OnDestroy {
  protected readonly principles = PRINCIPLES;

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

      gsap.from(root.querySelectorAll('[data-principle-line]'), {
        opacity: 0,
        y: 16,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: root, start: 'top 78%', once: true },
      });
    });
  }
}
