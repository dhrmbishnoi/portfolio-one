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
import { MotionService } from '../../../core/services/motion.service';
import { StageService } from '../../../core/three/stage.service';
import { MagneticDirective } from '../../../shared/directives/magnetic.directive';

/**
 * CONTACT CTA
 * ---------------------------------------------------------------------------
 * The closing frame. The artifact has travelled the whole page with the reader;
 * here it stops travelling and blooms — pulled to the centre, flattened and
 * widened into a horizon behind the invitation, so the site ends on light
 * rather than on a form.
 */
@Component({
  selector: 'app-contact-cta',
  standalone: true,
  imports: [RouterLink, MagneticDirective],
  templateUrl: './contact-cta.component.html',
  styleUrl: './contact-cta.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactCta implements OnDestroy {
  protected readonly site = SITE;

  private readonly host: HTMLElement = inject(ElementRef).nativeElement as HTMLElement;
  private readonly motion = inject(MotionService);
  private readonly stage = inject(StageService);
  private readonly scope = this.motion.scope(this.host);

  constructor() {
    afterNextRender(() => this.reveal());
  }

  ngOnDestroy(): void {
    this.scope.revert();
  }

  private reveal(): void {
    if (!this.motion.motionAllowed()) {
      return;
    }

    this.scope.run(() => {
      gsap.from('[data-cta-line]', {
        opacity: 0,
        y: 34,
        filter: 'blur(10px)',
        duration: 1,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: { trigger: this.host, start: 'top 78%', once: true },
      });
    });

    this.scope.scrub(
      this.host,
      (timeline) => {
        timeline.to(this.stage.params, {
          x: 0,
          y: -0.14,
          scale: 2.35,
          energy: 0.1,
          wire: 0.12,
          glow: 1,
          spin: 0.25,
          opacity: 0.5,
          spread: 1.9,
          twist: 0.6,
          ease: 'none',
        });
      },
      { start: 'top bottom', end: 'center center', scrub: 0.8 },
    );
  }
}
