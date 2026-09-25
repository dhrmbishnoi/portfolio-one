import { Injectable, signal } from '@angular/core';
import type { ArticleBody } from '../data/content.types';

/**
 * CONTENT SERVICE
 * ---------------------------------------------------------------------------
 * Article metadata ships with the bundle so the journal list paints on first
 * render. Article bodies are fetched on demand as JSON, which keeps the initial
 * payload proportional to what a reader actually opens.
 *
 * The fetch is genuine async work — it is what the journal skeleton states are
 * for. Nothing here is artificially delayed.
 */
@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly cache = new Map<string, ArticleBody>();
  private readonly inFlight = new Map<string, Promise<ArticleBody>>();

  readonly error = signal<string | null>(null);

  async loadArticle(path: string, slug: string): Promise<ArticleBody> {
    const cached = this.cache.get(slug);
    if (cached) {
      return cached;
    }

    const pending = this.inFlight.get(slug);
    if (pending) {
      return pending;
    }

    const request = fetch(path, { headers: { Accept: 'application/json' } })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Unable to load article "${slug}" (${response.status})`);
        }
        const body = (await response.json()) as ArticleBody;
        this.cache.set(slug, body);
        return body;
      })
      .finally(() => this.inFlight.delete(slug));

    this.inFlight.set(slug, request);
    return request;
  }
}
