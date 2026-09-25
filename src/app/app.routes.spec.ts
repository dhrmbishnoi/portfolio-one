import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Router, TitleStrategy, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { journalGuard, projectGuard, routes } from './app.routes';
import { AppTitleStrategy } from './core/services/title-strategy';
import { SeoService } from './core/services/seo.service';

/** Route table as a lookup by path. */
function routeAt(path: string) {
  return routes.find((route) => route.path === path);
}

describe('app.routes', () => {
  it('declares every required route', () => {
    const paths = routes.map((route) => route.path);
    expect(paths).toEqual([
      '',
      'work',
      'work/:slug',
      'systems',
      'about',
      'journal',
      'journal/:slug',
      'contact',
      '404',
      '**',
    ]);
  });

  it('lazy-loads every route — nothing is eagerly bundled', () => {
    for (const route of routes) {
      expect(typeof route.loadComponent).toBe('function');
      expect(route.component).toBeUndefined();
    }
  });

  it('guards the dynamic project and article routes', () => {
    expect(routeAt('work/:slug')?.canActivate).toBeDefined();
    expect(routeAt('work/:slug')?.canActivate).toHaveLength(1);
    expect(routeAt('journal/:slug')?.canActivate).toBeDefined();
    expect(routeAt('journal/:slug')?.canActivate).toHaveLength(1);
  });

  it('declares SEO metadata for every route', () => {
    for (const route of routes) {
      expect(route.data).toBeDefined();
      expect(route.data?.['seo']).toBeDefined();
    }
  });

  it('gives the 404 route noindex metadata', () => {
    const notFound = routeAt('404')?.data?.['seo'];
    expect(notFound).toMatchObject({ title: 'Page not found', noIndex: true });
  });

  it('resolves project metadata from the slug', () => {
    const resolve = routeAt('work/:slug')?.data?.['seo'] as (
      route: { paramMap: Map<string, string> },
    ) => { title: string; path: string; noIndex?: boolean };

    const snapshot = (slug: string) => ({ paramMap: new Map([['slug', slug]]) });

    const orbital = resolve(snapshot('orbital'));
    expect(orbital.title).toBe('Orbital — case study');
    expect(orbital.path).toBe('/work/orbital');

    const missing = resolve(snapshot('nope'));
    expect(missing.title).toBe('Case study not found');
    expect(missing.noIndex).toBe(true);
  });

  it('resolves article metadata from the slug', () => {
    const resolve = routeAt('journal/:slug')?.data?.['seo'] as (
      route: { paramMap: Map<string, string> },
    ) => { title: string; path: string; publishedTime?: string; noIndex?: boolean };

    const snapshot = (slug: string) => ({ paramMap: new Map([['slug', slug]]) });

    const entry = resolve(snapshot('accessibility-beyond-checklists'));
    expect(entry.title).toBe('Accessibility Beyond Checklists');
    expect(entry.path).toBe('/journal/accessibility-beyond-checklists');
    expect(entry.publishedTime).toBe('2025-03-14');

    const missing = resolve(snapshot('nope'));
    expect(missing.noIndex).toBe(true);
  });
});

describe('route guards', () => {
  const snapshot = (slug: string | null) =>
    ({ paramMap: new Map(slug === null ? [] : [['slug', slug]]) }) as never;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  /**
   * Angular invokes functional guards inside an injection context (they call
   * `inject(Router)`), so the test has to do the same.
   */
  function runGuard(guard: (route: never) => unknown, slug: string | null): unknown {
    return TestBed.runInInjectionContext(() => guard(snapshot(slug)));
  }

  function serialize(result: unknown): string {
    return TestBed.inject(Router).serializeUrl(result as ReturnType<Router['createUrlTree']>);
  }

  it('allows known project slugs through', () => {
    expect(runGuard(projectGuard, 'orbital')).toBe(true);
    expect(runGuard(projectGuard, 'forge')).toBe(true);
    expect(runGuard(projectGuard, 'signal')).toBe(true);
  });

  it('redirects an unknown project slug to the 404 route', () => {
    expect(serialize(runGuard(projectGuard, 'nope'))).toBe('/404');
  });

  it('redirects a missing project slug to the 404 route', () => {
    expect(serialize(runGuard(projectGuard, null))).toBe('/404');
  });

  it('allows known article slugs through', () => {
    expect(runGuard(journalGuard, 'signals-rxjs-state-ownership')).toBe(true);
    expect(runGuard(journalGuard, 'accessibility-beyond-checklists')).toBe(true);
  });

  it('redirects an unknown article slug to the 404 route', () => {
    expect(serialize(runGuard(journalGuard, 'nope'))).toBe('/404');
  });

  it('redirects a missing article slug to the 404 route', () => {
    expect(serialize(runGuard(journalGuard, null))).toBe('/404');
  });
});

describe('AppTitleStrategy', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), SeoService, { provide: TitleStrategy, useClass: AppTitleStrategy }],
    });
    return TestBed.inject(TitleStrategy);
  }

  it('is the configured title strategy', () => {
    expect(setup()).toBeInstanceOf(AppTitleStrategy);
  });

  it('applies route metadata to the document', () => {
    const strategy = setup();
    const doc = TestBed.inject(SeoService);
    const spy = vi.spyOn(doc, 'apply');

    strategy.updateTitle({
      url: '/work',
      root: { data: { seo: { title: 'Selected work', description: 'd', path: '/work' } } },
    } as never);

    expect(spy).toHaveBeenCalledWith({ title: 'Selected work', description: 'd', path: '/work' });
  });

  it('resolves a metadata function against the matched route', () => {
    const strategy = setup();
    const seo = TestBed.inject(SeoService);
    const spy = vi.spyOn(seo, 'apply');

    strategy.updateTitle({
      url: '/work/orbital',
      root: {
        data: {},
        firstChild: {
          data: {
            seo: (route: { paramMap: Map<string, string> }) => ({
              title: `Project ${route.paramMap.get('slug')}`,
              description: 'd',
              path: '/work/orbital',
            }),
          },
          paramMap: new Map([['slug', 'orbital']]),
        },
      },
    } as never);

    expect(spy).toHaveBeenCalledWith({
      title: 'Project orbital',
      description: 'd',
      path: '/work/orbital',
    });
  });

  it('ignores snapshots without SEO metadata', () => {
    const strategy = setup();
    const seo = TestBed.inject(SeoService);
    const spy = vi.spyOn(seo, 'apply');
    strategy.updateTitle({ url: '/', root: { data: {} } } as never);
    expect(spy).not.toHaveBeenCalled();
  });
});
