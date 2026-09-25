import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, type Routes } from '@angular/router';
import { isProjectSlug } from './core/data/projects.data';
import { isJournalSlug } from './core/data/journal.data';
import { findProject } from './core/data/projects.data';
import { findJournalEntry } from './core/data/journal.data';
import type { SeoDefinition } from './core/services/title-strategy';

/**
 * ROUTES
 * ---------------------------------------------------------------------------
 * Every route is a lazily loaded standalone component — no route ships code it
 * does not need. Each route declares its own metadata under `data.seo`, which the
 * `AppTitleStrategy` applies (title, description, canonical, Open Graph,
 * Twitter card, robots). Dynamic segments resolve their metadata from the
 * matched snapshot, and unknown slugs are redirected to the 404 route.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
    data: {
      seo: {
        title: 'Noah Mercer — Senior Frontend & Product Engineer',
        description:
          'Frontend architecture, design systems, performance and accessibility for products that need to last.',
        path: '/',
        type: 'profile',
      } satisfies SeoDefinition,
    },
  },
  {
    path: 'work',
    loadComponent: () => import('./features/work/work.component').then((m) => m.WorkComponent),
    data: {
      seo: {
        title: 'Selected work',
        description:
          'Three selected projects: an operational planning interface, design system infrastructure and a frontend observability tool.',
        path: '/work',
      } satisfies SeoDefinition,
    },
  },
  {
    path: 'work/:slug',
    loadComponent: () =>
      import('./features/work/case-study.component').then((m) => m.CaseStudyComponent),
    canActivate: [projectGuard],
    data: {
      seo: ((route: ActivatedRouteSnapshot) => {
        const slug = route.paramMap.get('slug') ?? '';
        const project = findProject(slug);

        if (!project) {
          return {
            title: 'Case study not found',
            description: 'The requested case study does not exist.',
            path: `/work/${slug}`,
            noIndex: true,
          };
        }

        return {
          title: `${project.title} — case study`,
          description: project.problem,
          path: `/work/${project.slug}`,
          type: 'article',
          section: 'Selected work',
          tags: project.focus,
        };
      }) satisfies SeoDefinition,
    },
  },
  {
    path: 'systems',
    loadComponent: () => import('./features/systems/systems.component').then((m) => m.SystemsComponent),
    data: {
      seo: {
        title: 'Systems',
        description:
          'An engineering manual: Angular architecture, the design token model, state ownership, accessibility states, performance budgets and testing philosophy.',
        path: '/systems',
      } satisfies SeoDefinition,
    },
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.component').then((m) => m.AboutComponent),
    data: {
      seo: {
        title: 'About',
        description:
          'How Noah Mercer works between design decisions and engineering systems: product-minded engineering, technical leadership, frontend architecture, performance and accessibility.',
        path: '/about',
        type: 'profile',
      } satisfies SeoDefinition,
    },
  },
  {
    path: 'journal',
    loadComponent: () => import('./features/journal/journal.component').then((m) => m.JournalComponent),
    data: {
      seo: {
        title: 'Journal',
        description:
          'Writing on frontend architecture, design systems, performance budgets, accessibility and state ownership.',
        path: '/journal',
      } satisfies SeoDefinition,
    },
  },
  {
    path: 'journal/:slug',
    loadComponent: () =>
      import('./features/journal/article.component').then((m) => m.ArticleComponent),
    canActivate: [journalGuard],
    data: {
      seo: ((route: ActivatedRouteSnapshot) => {
        const slug = route.paramMap.get('slug') ?? '';
        const entry = findJournalEntry(slug);

        if (!entry) {
          return {
            title: 'Article not found',
            description: 'The requested article does not exist.',
            path: `/journal/${slug}`,
            noIndex: true,
          };
        }

        return {
          title: entry.title,
          description: entry.excerpt,
          path: `/journal/${entry.slug}`,
          type: 'article',
          publishedTime: entry.date,
          modifiedTime: entry.date,
          section: entry.tag,
          tags: [entry.tag],
        };
      }) satisfies SeoDefinition,
    },
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact.component').then((m) => m.ContactComponent),
    data: {
      seo: {
        title: 'Contact',
        description:
          'Start a conversation about frontend architecture, design systems and long-term product quality.',
        path: '/contact',
      } satisfies SeoDefinition,
    },
  },
  {
    path: '404',
    loadComponent: () => import('./features/not-found.component').then((m) => m.NotFoundComponent),
    data: {
      seo: {
        title: 'Page not found',
        description:
          'That route does not exist on this site. Return to the selected work, the journal or the home page.',
        path: '/404',
        noIndex: true,
      } satisfies SeoDefinition,
    },
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found.component').then((m) => m.NotFoundComponent),
    data: {
      seo: {
        title: 'Page not found',
        description:
          'That route does not exist on this site. Return to the selected work, the journal or the home page.',
        path: '/404',
        noIndex: true,
      } satisfies SeoDefinition,
    },
  },
];

/** Redirects an unknown project slug to the 404 route. */
export function projectGuard(
  route: ActivatedRouteSnapshot,
): boolean | ReturnType<Router['createUrlTree']> {
  const slug = route.paramMap.get('slug');
  if (!slug || !isProjectSlug(slug)) {
    return inject(Router).createUrlTree(['/404']);
  }
  return true;
}

/** Redirects an unknown article slug to the 404 route. */
export function journalGuard(
  route: ActivatedRouteSnapshot,
): boolean | ReturnType<Router['createUrlTree']> {
  const slug = route.paramMap.get('slug');
  if (!slug || !isJournalSlug(slug)) {
    return inject(Router).createUrlTree(['/404']);
  }
  return true;
}
