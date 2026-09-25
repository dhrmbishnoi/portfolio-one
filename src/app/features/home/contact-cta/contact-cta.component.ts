import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { SITE } from '../../../core/config/site.config';
import { MotionService, nextFrame } from '../../../core/services/motion.service';

/**
 * CONTACT CTA
 * ---------------------------------------------------------------------------
 * The strong closing statement on the home page. Dark surface, serif headline,
 * and the single lime accent reserved for the word that matters.
 */
@Component({
  selector: 'app-contact-cta',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './contact-cta.component.html',
  styleUrl: './contact-cta.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'on-dark' },
})
export class ContactCta implements OnDestroy {
  protected readonly site = SITE;

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

      gsap.from(root.querySelectorAll('[data-cta-line]'), {
        opacity: 0,
        y: 18,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: root, start: 'top 80%', once: true },
      });
    });
  }
}
