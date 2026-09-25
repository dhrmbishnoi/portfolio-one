import { describe, expect, it } from 'vitest';
import { SITE, canonicalUrl } from './site.config';

describe('site.config', () => {
  it('carries the identity in one place', () => {
    expect(SITE.identity.name).toBe('Noah Mercer');
    expect(SITE.identity.monogram).toBe('NM');
    expect(SITE.identity.role).toContain('Senior Frontend');
    expect(SITE.identity.role).toContain('Product Engineer');
  });

  it('declares availability and working arrangement', () => {
    expect(SITE.identity.availability).toBe('Open for selected work');
    expect(SITE.identity.availabilityState).toBe('open');
    expect(SITE.identity.location).toContain('Remote');
    expect(SITE.identity.experience).toMatch(/7/);
  });

  it('carries the contact channels used across the site', () => {
    expect(SITE.contact.email).toBe('hello@noahmercer.dev');
    expect(SITE.contact.mailto.startsWith('mailto:hello@noahmercer.dev')).toBe(true);
    expect(SITE.contact.mailto).toContain('subject=');
    expect(SITE.contact.github).toBe('https://github.com/noahmercer');
    expect(SITE.contact.linkedin).toBe('https://linkedin.com/in/noahmercer');
  });

  it('has exactly the five nav items in order', () => {
    expect(SITE.nav.map((item) => item.label)).toEqual([
      'Work',
      'Systems',
      'About',
      'Journal',
      'Contact',
    ]);
    expect(SITE.nav.map((item) => item.path)).toEqual([
      '/work',
      '/systems',
      '/about',
      '/journal',
      '/contact',
    ]);
  });

  it('gives every nav item a descriptive hint for the mobile menu', () => {
    for (const item of SITE.nav) {
      expect(item.hint.length).toBeGreaterThan(8);
    }
  });

  it('lists the external links', () => {
    expect(SITE.externalLinks.map((l) => l.label)).toEqual(['GitHub', 'LinkedIn', 'Email']);
  });

  it('carries the mono technical strip', () => {
    expect(SITE.technicalStack).toEqual([
      'ANGULAR',
      'TYPESCRIPT',
      'DESIGN SYSTEMS',
      'PERFORMANCE',
      'ACCESSIBILITY',
      'INTERACTION',
    ]);
  });

  it('builds canonical URLs without double slashes', () => {
    expect(canonicalUrl('/')).toBe('https://noahmercer.dev/');
    expect(canonicalUrl('/work')).toBe('https://noahmercer.dev/work');
    expect(canonicalUrl('/work/')).toBe('https://noahmercer.dev/work');
    expect(canonicalUrl('/journal/some-article')).toBe(
      'https://noahmercer.dev/journal/some-article',
    );
  });

  it('ships SEO defaults used by every route', () => {
    expect(SITE.seo.defaultTitle).toContain('Noah Mercer');
    expect(SITE.seo.defaultDescription.length).toBeGreaterThan(40);
    expect(SITE.seo.ogImage).toBe('/og-cover.svg');
    expect(SITE.seo.keywords.length).toBeGreaterThan(0);
  });
});
