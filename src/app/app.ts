import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeader } from './shared/components/site-header/site-header.component';
import { SiteFooter } from './shared/components/site-footer/site-footer.component';
import { TechnicalLoader } from './shared/components/technical-loader/technical-loader.component';
import { Cursor } from './shared/components/cursor/cursor.component';
import { BootstrapService } from './core/services/bootstrap.service';
import { SmoothScrollService } from './core/services/smooth-scroll.service';

/**
 * APP SHELL
 * ---------------------------------------------------------------------------
 * The shell owns the persistent chrome: the loader, the header, the router
 * outlet, the footer, the film grain and the pointer instrument. It also starts
 * the smooth scroller, because every scroll-driven story in the app measures
 * itself against that one scroller.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SiteHeader, SiteFooter, TechnicalLoader, Cursor],
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

    <app-cursor />
  `,
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  protected readonly bootstrap = inject(BootstrapService);
  private readonly scroll = inject(SmoothScrollService);

  ngOnInit(): void {
    this.scroll.initialise();
    void this.bootstrap.initialise();
  }
}
