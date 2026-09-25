import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeader } from './shared/components/site-header/site-header.component';
import { SiteFooter } from './shared/components/site-footer/site-footer.component';
import { TechnicalLoader } from './shared/components/technical-loader/technical-loader.component';
import { BootstrapService } from './core/services/bootstrap.service';

/**
 * APP SHELL
 * ---------------------------------------------------------------------------
 * The shell owns the header, the router outlet, the footer and the technical
 * loader. It does not own any layout decisions for individual routes.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SiteHeader, SiteFooter, TechnicalLoader],
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
  `,
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  protected readonly bootstrap = inject(BootstrapService);

  ngOnInit(): void {
    void this.bootstrap.initialise();
  }
}
