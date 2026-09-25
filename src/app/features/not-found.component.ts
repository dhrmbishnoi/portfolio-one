import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE } from '../core/config/site.config';

/**
 * NOT FOUND
 * ---------------------------------------------------------------------------
 * A real 404 page with its own metadata, a short explanation and routes back
 * into the site. Unknown project and article slugs are redirected here by their
 * route guards.
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The inner pages stay in the daylight editorial register: the dark, cinematic
  // treatment is the home narrative's voice, and the documents read better on paper.
  host: { class: 'on-paper' },
})
export class NotFoundComponent {
  protected readonly site = SITE;
}
