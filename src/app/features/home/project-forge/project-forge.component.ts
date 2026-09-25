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
import { FORGE_VISUALS } from '../../../core/data/projects.data';
import { MotionService, nextFrame } from '../../../core/services/motion.service';
import { TechnicalDiagram } from '../../../shared/components/technical-diagram/technical-diagram.component';
import { CodeBlock } from '../../../shared/components/code-block/code-block.component';

/**
 * PROJECT 02 — FORGE
 * ---------------------------------------------------------------------------
 * Dark section. Component anatomy, token graph, interaction states, component
 * API, accessibility patterns and theme layers. Deliberately not another
 * dashboard: the visual language is an anatomy plate, not a metrics grid.
 */
@Component({
  selector: 'app-project-forge',
  standalone: true,
  imports: [RouterLink, TechnicalDiagram, CodeBlock],
  templateUrl: './project-forge.component.html',
  styleUrl: './project-forge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'on-dark' },
})
export class ProjectForge implements OnDestroy {
  private readonly host: HTMLElement = inject(ElementRef).nativeElement as HTMLElement;
  private readonly motion = inject(MotionService);
  private readonly scope = this.motion.scope(inject(ElementRef).nativeElement as HTMLElement);

  protected readonly project = {
    index: '02',
    title: 'Forge',
    subtitle: 'Design system infrastructure for multi-product organizations.',
    year: '2023',
    role: 'Design systems engineer — tokens, components, governance',
    focus: ['Component architecture', 'Tokens', 'Accessibility', 'Documentation', 'Governance'],
    problem:
      'Four product teams each maintained their own button, their own spacing scale and their own idea of focus. The UI looked unrelated to itself and accessibility varied by squad.',
    built:
      'A token pipeline, a component library with an explicit API surface, accessibility behaviour shipped inside the components, and a governance model that made adoption cheaper than divergence.',
    technicalFocus: [
      'Three-layer token model: primitives, aliases, component tokens',
      'Accessibility contract owned by the component, not the caller',
      'Theme instances as overridable token sets',
      'Documentation generated from the same types the build consumes',
    ],
  };

  protected readonly visuals = FORGE_VISUALS;

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

      // Component states and tokens reveal: anatomy layers rise, token graph
      // rules draw, state swatches settle.
      gsap.from(root.querySelectorAll('[data-forge-layer]'), {
        opacity: 0,
        y: 16,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.07,
        scrollTrigger: { trigger: root, start: 'top 74%', once: true },
      });

      gsap.from(root.querySelectorAll('[data-forge-state]'), {
        opacity: 0,
        y: 12,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.05,
        scrollTrigger: { trigger: root.querySelector('[data-forge-states]') ?? root, start: 'top 80%', once: true },
      });
    });
  }
}
