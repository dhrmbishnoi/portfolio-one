import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  inject,
} from '@angular/core';
import { gsap } from 'gsap';
import { SYSTEM_ENTRIES } from '../../../core/data/systems.data';
import { MotionService, nextFrame } from '../../../core/services/motion.service';
import { ParallaxDirective } from '../../../shared/directives/parallax.directive';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

/**
 * SYSTEMS I CARE ABOUT
 * ---------------------------------------------------------------------------
 * Four large editorial entries. No cards — thin rules and strong spacing carry
 * the structure. Each entry has one subtle interaction driven by its own
 * declared `interaction` type, so the section varies instead of repeating.
 */
@Component({
  selector: 'app-systems-section',
  standalone: true,
  imports: [RevealDirective, ParallaxDirective],
  templateUrl: './systems-section.component.html',
  styleUrl: './systems-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The daylight interlude: the paper register gives the eye a rest between the
  // two dark movements and the two that follow.
  host: { class: 'on-paper register-seam register-seam--top' },
})
export class SystemsSection implements OnDestroy {
  protected readonly entries = SYSTEM_ENTRIES;

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

      gsap.from(root.querySelectorAll('[data-system-entry]'), {
        opacity: 0,
        y: 20,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: root, start: 'top 76%', once: true },
      });

      gsap.from(root.querySelectorAll('[data-system-rule]'), {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 0.8,
        ease: 'power2.inOut',
        stagger: 0.08,
        scrollTrigger: { trigger: root, start: 'top 76%', once: true },
      });
    });
  }
}
