import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeader } from './shared/components/site-header/site-header.component';
import { SiteFooter } from './shared/components/site-footer/site-footer.component';
import { TechnicalLoader } from './shared/components/technical-loader/technical-loader.component';
import { Cursor } from './shared/components/cursor/cursor.component';
import { PageCurtain } from './shared/components/page-curtain/page-curtain.component';
import { BootstrapService } from './core/services/bootstrap.service';
import { NavigationLifecycle } from './core/services/navigation.service';
import { SmoothScrollService } from './core/services/smooth-scroll.service';

/**
 * APP SHELL
 * ---------------------------------------------------------------------------
 * The shell owns the persistent chrome: the loader, the header, the router
 * outlet, the footer, the film grain, the route curtain and the pointer
 * instrument. It also starts the smooth scroller, because every scroll-driven
 * story in the app measures itself against that one scroller.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SiteHeader, SiteFooter, TechnicalLoader, Cursor, PageCurtain],
  template: `
    <a class="skip-link" href="#main" [attr.href]="'#main'">Skip to content</a>

    @if (bootstrap.state() !== 'ready') {
      <app-technical-loader
        [visible]="bootstrap.state() === 'initialising'"
        [progress]="bootstrap.progress()"
      />
    }

    <app-site-header />

    <main id="main" tabindex="-1">
      <router-outlet />
    </main>

    <app-site-footer />

    <!-- Film grain: one inline SVG turbulence layer over the document. -->
    <div class="grain" aria-hidden="true"></div>

    <!-- Route changes are covered by the curtain rather than left to snap. -->
    <app-page-curtain />

    <app-cursor />
  `,
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  protected readonly bootstrap = inject(BootstrapService);
  private readonly scroll = inject(SmoothScrollService);
  // Instantiated for its side effects: it re-measures after each navigation and
  // hands focus to the new page. The shell is the only place that always exists.
  private readonly navigation = inject(NavigationLifecycle);

  ngOnInit(): void {
    this.scroll.initialise();
    void this.bootstrap.initialise();
  }
}
