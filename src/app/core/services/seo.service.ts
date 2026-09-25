import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { SITE, canonicalUrl } from '../config/site.config';

export interface PageMetadata {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly type?: 'website' | 'article' | 'profile';
  readonly publishedTime?: string;
  readonly modifiedTime?: string;
  readonly section?: string;
  readonly tags?: readonly string[];
  readonly noIndex?: boolean;
}

/**
 * SEO SERVICE
 * ---------------------------------------------------------------------------
 * Route-level metadata is centralised in `site.config.ts`; this service applies
 * it to the document. Every route pushes its own title, description, canonical
 * URL, Open Graph and Twitter card, including the 404 route.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly doc = inject(DOCUMENT);
  private readonly head = this.doc.head;

  /** Apply a full metadata set for a route. */
  apply(metadata: PageMetadata): void {
    const title = metadata.title.includes(SITE.identity.name)
      ? metadata.title
      : SITE.seo.titleTemplate.replace('%s', metadata.title);

    this.setTitle(title);
    this.setName('description', metadata.description);
    this.setProperty('og:title', title);
    this.setProperty('og:description', metadata.description);
    this.setProperty('og:type', metadata.type ?? 'website');
    this.setProperty('og:url', canonicalUrl(metadata.path));
    this.setProperty('og:site_name', SITE.seo.siteName);
    this.setProperty('og:locale', SITE.seo.locale);
    this.setProperty('og:image', absolute(SITE.seo.ogImage));
    this.setName('twitter:card', 'summary_large_image');
    this.setName('twitter:title', title);
    this.setName('twitter:description', metadata.description);
    this.setName('twitter:image', absolute(SITE.seo.ogImage));

    if (metadata.publishedTime) {
      this.setProperty('article:published_time', metadata.publishedTime);
    }
    if (metadata.modifiedTime) {
      this.setProperty('article:modified_time', metadata.modifiedTime);
    }
    if (metadata.section) {
      this.setProperty('article:section', metadata.section);
    }
    if (metadata.tags?.length) {
      this.appendProperties('article:tag', metadata.tags);
    }

    this.setCanonical(metadata.path);
    this.setName('robots', metadata.noIndex ? 'noindex, nofollow' : 'index, follow');
  }

  /** Fall back to the site-wide defaults (used by the 404 route). */
  applyDefaults(): void {
    this.apply({
      title: SITE.seo.defaultTitle,
      description: SITE.seo.defaultDescription,
      path: '/404',
      noIndex: true,
    });
  }

  private setTitle(value: string): void {
    this.doc.title = value;
    this.setProperty('og:title', value);
  }

  private setCanonical(path: string): void {
    this.upsert('link', 'rel', 'canonical').setAttribute('href', canonicalUrl(path));
  }

  private setName(name: string, content: string): void {
    this.upsert('meta', 'name', name).setAttribute('content', content);
  }

  private setProperty(property: string, content: string): void {
    this.upsert('meta', 'property', property).setAttribute('content', content);
  }

  /**
   * Adds one element per value. `article:tag` is repeatable by spec — an
   * upsert would silently keep only the last tag.
   */
  private appendProperties(property: string, values: readonly string[]): void {
    this.head
      .querySelectorAll(`meta[property="${property}"]`)
      .forEach((element) => element.remove());

    for (const value of values) {
      const el = this.doc.createElement('meta');
      el.setAttribute('property', property);
      el.setAttribute('content', value);
      this.head.appendChild(el);
    }
  }

  /** Find or create the element, so repeated calls never duplicate tags. */
  private upsert(tag: string, attr: 'name' | 'property' | 'rel', key: string): Element {
    const selector = `${tag}[${attr}="${key}"]`;
    const existing = this.head.querySelector(selector);
    if (existing) {
      return existing;
    }
    const el = this.doc.createElement(tag);
    el.setAttribute(attr, key);
    this.head.appendChild(el);
    return el;
  }
}

function absolute(path: string): string {
  return path.startsWith('http') ? path : `${SITE.seo.baseUrl}${path}`;
}
