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
import { MANUAL_SECTIONS } from '../../core/data/systems.data';
import { MotionService, nextFrame } from '../../core/services/motion.service';
import { CodeBlock } from '../../shared/components/code-block/code-block.component';
import { TechnicalDiagram } from '../../shared/components/technical-diagram/technical-diagram.component';

/**
 * SYSTEMS — the engineering manual
 * ---------------------------------------------------------------------------
 * Reference material, not a services page: an architecture map, the token model,
 * state ownership patterns, accessibility states, a performance budget model,
 * component API examples and a testing philosophy.
 */
@Component({
  selector: 'app-systems',
  standalone: true,
  imports: [RouterLink, CodeBlock, TechnicalDiagram],
  templateUrl: './systems.component.html',
  styleUrl: './systems.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The inner pages stay in the daylight editorial register: the dark, cinematic
  // treatment is the home narrative's voice, and the documents read better on paper.
  host: { class: 'on-paper' },
})
export class SystemsComponent implements OnDestroy {
  protected readonly sections = MANUAL_SECTIONS;

  private readonly host = inject(ElementRef).nativeElement as HTMLElement;
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

      gsap.from(root.querySelectorAll('[data-manual-section]'), {
        opacity: 0,
        y: 18,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.07,
        scrollTrigger: { trigger: root, start: 'top 80%', once: true },
      });
    });
  }
}
