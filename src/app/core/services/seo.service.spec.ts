import { DOCUMENT } from '@angular/common';
import { describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SeoService, type PageMetadata } from './seo.service';
import { SITE } from '../config/site.config';

function setup() {
  TestBed.configureTestingModule({ providers: [SeoService] });
  return { seo: TestBed.inject(SeoService), doc: TestBed.inject(DOCUMENT) };
}

function meta(overrides: Partial<PageMetadata> = {}): PageMetadata {
  return {
    title: 'Selected work',
    description: 'Three selected projects.',
    path: '/work',
    ...overrides,
  };
}

describe('SeoService', () => {
  it('applies the site title template when the title lacks the name', () => {
    const { seo, doc } = setup();
    seo.apply(meta());
    expect(doc.title).toBe(SITE.seo.titleTemplate.replace('%s', 'Selected work'));
    expect(doc.title).toContain('Noah Mercer');
  });

  it('does not double-apply the name when the title already has it', () => {
    const { seo, doc } = setup();
    seo.apply(meta({ title: 'Noah Mercer — Senior Frontend & Product Engineer' }));
    expect(doc.title).toBe('Noah Mercer — Senior Frontend & Product Engineer');
    expect(doc.title.match(/Noah Mercer/g)).toHaveLength(1);
  });

  it('writes description, canonical, Open Graph and Twitter metadata', () => {
    const { seo, doc } = setup();
    seo.apply(meta({ description: 'Route level description.' }));

    const get = (selector: string) =>
      doc.head.querySelector<HTMLMetaElement>(selector)?.getAttribute('content');

    expect(get('meta[name="description"]')).toBe('Route level description.');
    expect(get('meta[property="og:description"]')).toBe('Route level description.');
    expect(get('meta[property="og:url"]')).toBe('https://noahmercer.dev/work');
    expect(get('meta[property="og:type"]')).toBe('website');
    expect(get('meta[property="og:site_name"]')).toBe(SITE.seo.siteName);
    expect(get('meta[property="og:image"]')).toBe('https://noahmercer.dev/og-cover.svg');
    expect(get('meta[name="twitter:card"]')).toBe('summary_large_image');
    expect(get('meta[name="twitter:image"]')).toBe('https://noahmercer.dev/og-cover.svg');
  });

  it('points the canonical link at the route path', () => {
    const { seo, doc } = setup();
    seo.apply(meta({ path: '/work/orbital' }));
    const canonical = doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe('https://noahmercer.dev/work/orbital');
  });

  it('marks article routes with Open Graph article metadata', () => {
    const { seo, doc } = setup();
    seo.apply(
      meta({
        type: 'article',
        publishedTime: '2025-03-14',
        modifiedTime: '2025-04-01',
        section: 'Accessibility',
        tags: ['Accessibility', 'Frontend'],
      }),
    );

    const property = (name: string) =>
      doc.head.querySelector<HTMLMetaElement>(`meta[property="${name}"]`)?.getAttribute('content');

    expect(property('og:type')).toBe('article');
    expect(property('article:published_time')).toBe('2025-03-14');
    expect(property('article:modified_time')).toBe('2025-04-01');
    expect(property('article:section')).toBe('Accessibility');
    expect(doc.head.querySelectorAll('meta[property="article:tag"]')).toHaveLength(2);
  });

  it('sets noindex on routes that must not be indexed', () => {
    const { seo, doc } = setup();
    seo.apply(meta({ noIndex: true, path: '/404' }));
    expect(doc.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex, nofollow',
    );
  });

  it('leaves indexable routes indexable', () => {
    const { seo, doc } = setup();
    seo.apply(meta());
    expect(doc.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'index, follow',
    );
  });

  it('replaces rather than duplicates metadata on repeated applications', () => {
    const { seo, doc } = setup();
    seo.apply(meta());
    seo.apply(meta({ title: 'Systems' }));
    seo.apply(meta({ title: 'About' }));

    expect(doc.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(doc.head.querySelectorAll('meta[property="og:url"]')).toHaveLength(1);
    expect(doc.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(doc.title).toBe(SITE.seo.titleTemplate.replace('%s', 'About'));
  });

  it('applyDefaults targets the 404 route and suppresses indexing', () => {
    const { seo, doc } = setup();
    seo.applyDefaults();
    expect(doc.title).toBe(SITE.seo.defaultTitle);
    expect(doc.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex, nofollow',
    );
    expect(
      doc.head.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe('https://noahmercer.dev/404');
  });
});
