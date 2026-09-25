import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectOrbital } from '../project-orbital/project-orbital.component';
import { ProjectForge } from '../project-forge/project-forge.component';
import { ProjectSignal } from '../project-signal/project-signal.component';

/**
 * SELECTED WORK
 * ---------------------------------------------------------------------------
 * Three projects, three deliberately different layouts. The wrapper owns the
 * section heading and the rhythm between them; each project owns its own
 * presentation language.
 */
@Component({
  selector: 'app-selected-work',
  standalone: true,
  imports: [ProjectOrbital, ProjectForge, ProjectSignal],
  templateUrl: './selected-work.component.html',
  styleUrl: './selected-work.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectedWork {}
