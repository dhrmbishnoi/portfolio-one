import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SITE } from '../../core/config/site.config';

/**
 * CONTACT
 * ---------------------------------------------------------------------------
 * The final dark section. One headline with the accent reserved for a single
 * word, one supporting paragraph, one CTA, and the three ways to reach me.
 */
@Component({
  selector: 'app-contact',
  standalone: true,
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'on-dark' },
})
export class ContactComponent {
  protected readonly site = SITE;
}
