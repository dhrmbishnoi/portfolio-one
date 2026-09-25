import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Hero } from './hero/hero.component';
import { SelectedWork } from './selected-work/selected-work.component';
import { SystemsSection } from './systems-section/systems-section.component';
import { Principles } from './principles/principles.component';
import { Method } from './method/method.component';
import { ContactCta } from './contact-cta/contact-cta.component';

/**
 * HOME
 * ---------------------------------------------------------------------------
 * Page rhythm: hero → selected work → systems → principles → method → contact.
 * The component owns the page's metadata and the order of its sections; each
 * section owns its own composition and motion.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Hero, SelectedWork, SystemsSection, Principles, Method, ContactCta],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {}
