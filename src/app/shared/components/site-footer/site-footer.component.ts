import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SITE } from '../../../core/config/site.config';
import { MagneticDirective } from '../../directives/magnetic.directive';

/**
 * SITE FOOTER
 * ---------------------------------------------------------------------------
 * The last frame of the story: a closing ticker, the identity block, navigation,
 * external links, a magnetic back-to-top control, and a plain statement of how
 * the site is actually built.
 */
@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MagneticDirective],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {
  protected readonly site = SITE;
  protected readonly year = new Date().getFullYear();

  protected readonly ticker: readonly string[] = [
    'Frontend architecture',
    'Design systems',
    'Interaction design',
    'WebGL',
    'Performance budgets',
    'Accessibility',
    'TypeScript',
    'Motion',
  ];

  protected isExternal(href: string): boolean {
    return href.startsWith('http');
  }

  protected backToTop(): void {
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }
}
