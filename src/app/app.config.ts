import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { TitleStrategy, provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { AppTitleStrategy } from './core/services/title-strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    // Route metadata (titles, descriptions, canonical, Open Graph) is applied by
    // the SEO service through this strategy — see core/services/title-strategy.ts.
    { provide: TitleStrategy, useClass: AppTitleStrategy },
  ],
};
