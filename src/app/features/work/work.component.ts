import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PROJECTS } from '../../core/data/projects.data';

/**
 * WORK
 * ---------------------------------------------------------------------------
 * An index of the three selected projects. Deliberately an editorial list rather
 * than a card grid: each row is a project with its number, year, role, focus and
 * a route into the full case study.
 */
@Component({
  selector: 'app-work',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './work.component.html',
  styleUrl: './work.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The inner pages stay in the daylight editorial register: the dark, cinematic
  // treatment is the home narrative's voice, and the documents read better on paper.
  host: { class: 'on-paper' },
})
export class WorkComponent {
  protected readonly projects = PROJECTS;
}
