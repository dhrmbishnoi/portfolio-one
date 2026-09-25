import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SITE } from '../../../core/config/site.config';

/**
 * SITE FOOTER
 * ---------------------------------------------------------------------------
 * Minimal: monogram, identity, navigation, external links, copyright and a
 * back-to-top control that scrolls to the top of the document.
 */
@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {
  protected readonly site = SITE;
  protected readonly year = new Date().getFullYear();

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
