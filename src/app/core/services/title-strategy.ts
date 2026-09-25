import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, TitleStrategy, RouterStateSnapshot } from '@angular/router';
import { SeoService, type PageMetadata } from './seo.service';

/**
 * A route's metadata, either static or resolved from the matched snapshot.
 */
export type SeoDefinition = PageMetadata | ((route: ActivatedRouteSnapshot) => PageMetadata);

const SEO_DATA_KEY = 'seo';

/**
 * APP TITLE STRATEGY
 * ---------------------------------------------------------------------------
 * Route metadata lives in the route configuration — one place, centralised, and
 * resolvable from route params for dynamic segments. The strategy applies the
 * full metadata set (title, description, canonical, Open Graph, Twitter card,
 * robots) inside `updateTitle`, so the metadata is always written by the one
 * service that owns it.
 *
 * Note: `Router` is deliberately not injected here — it would create the cycle
 * Router → NavigationTransitions → TitleStrategy → Router. The current URL is
 * read from the snapshot instead.
 */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private readonly seo = inject(SeoService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const route = deepestRouteWithSeo(snapshot.root);

    if (!route) {
      return;
    }

    const definition = route.data[SEO_DATA_KEY] as SeoDefinition | undefined;
    if (!definition) {
      return;
    }

    const metadata = typeof definition === 'function' ? definition(route) : definition;
    const path = metadata.path || snapshot.url || '/';

    this.seo.apply({ ...metadata, path });
  }
}

/** Walks to the deepest activated route that declares SEO metadata. */
function deepestRouteWithSeo(root: ActivatedRouteSnapshot): ActivatedRouteSnapshot | null {
  let current: ActivatedRouteSnapshot | null = root;
  let match: ActivatedRouteSnapshot | null = null;

  while (current) {
    if (current.data && current.data[SEO_DATA_KEY]) {
      match = current;
    }
    current = current.firstChild;
  }

  return match;
}
