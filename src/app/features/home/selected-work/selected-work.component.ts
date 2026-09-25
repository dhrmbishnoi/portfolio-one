import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MotionService } from '../../../core/services/motion.service';
import { StageService } from '../../../core/three/stage.service';
import { MagneticDirective } from '../../../shared/directives/magnetic.directive';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { ProjectOrbital } from '../project-orbital/project-orbital.component';
import { ProjectForge } from '../project-forge/project-forge.component';
import { ProjectSignal } from '../project-signal/project-signal.component';

/**
 * SELECTED WORK
 * ---------------------------------------------------------------------------
 * Three projects, three deliberately different languages. The artifact steps
 * aside here — it pulls to the far left, drops its core energy and reads as a
 * wireframe blueprint — so the case-study surfaces get the whole stage.
 */
@Component({
  selector: 'app-selected-work',
  standalone: true,
  imports: [RouterLink, ProjectOrbital, ProjectForge, ProjectSignal, RevealDirective, MagneticDirective],
  templateUrl: './selected-work.component.html',
  styleUrl: './selected-work.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectedWork implements OnDestroy {
  private readonly host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly motion = inject(MotionService);
  private readonly stage = inject(StageService);
  private readonly scope = this.motion.scope(this.host);

  protected readonly headlineReveal = {
    type: 'lines' as const,
    stagger: 0.09,
  };

  constructor() {
    afterNextRender(() => this.direct());
  }

  ngOnDestroy(): void {
    this.scope.revert();
  }

  private direct(): void {
    if (!this.motion.motionAllowed()) {
      return;
    }
    this.scope.scrub(
      this.host,
      (timeline) => {
        timeline.to(this.stage.params, {
          x: -1.05,
          y: -0.06,
          scale: 0.78,
          energy: 0.12,
          wire: 0.85,
          glow: 0.28,
          spin: 0.4,
          opacity: 0.36,
          spread: 1.5,
          ease: 'none',
        });
      },
      { start: 'top 80%', end: 'top 20%', scrub: 0.7 },
    );
  }
}
