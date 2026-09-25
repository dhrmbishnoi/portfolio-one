import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import type { ArticleBlock, ArticleBody } from '../../core/data/content.types';
import { findJournalEntry, nextJournalEntry } from '../../core/data/journal.data';
import { SITE } from '../../core/config/site.config';
import { ContentService } from '../../core/services/content.service';
import { CodeBlock } from '../../shared/components/code-block/code-block.component';

/**
 * ARTICLE
 * ---------------------------------------------------------------------------
 * The body is fetched as JSON on demand — genuine async work, which is what the
 * skeleton state is for. Nothing is artificially delayed; on a warm cache the
 * skeleton is replaced on the first frame.
 */
@Component({
  selector: 'app-article',
  standalone: true,
  imports: [RouterLink, CodeBlock],
  templateUrl: './article.component.html',
  styleUrl: './article.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly content = inject(ContentService);

  private readonly slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug') ?? '')),
    { initialValue: '' },
  );

  protected readonly entry = computed(() => findJournalEntry(this.slug()));
  protected readonly next = computed(() =>
    this.entry() ? nextJournalEntry(this.entry()!.slug) : undefined,
  );

  protected readonly body = signal<ArticleBody | null>(null);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  protected readonly site = SITE;

  constructor() {
    const load = (): void => {
      const entry = this.entry();
      if (!entry) {
        this.loading.set(false);
        return;
      }

      this.loading.set(true);
      this.failed.set(false);
      void this.content
        .loadArticle(entry.bodyPath, entry.slug)
        .then((loaded) => {
          this.body.set(loaded);
          this.loading.set(false);
        })
        .catch(() => {
          this.failed.set(true);
          this.loading.set(false);
        });
    };

    load();
    this.route.paramMap.subscribe(load);
  }

  protected formatDate(iso: string): string {
    const [year, month, day] = iso.split('-').map(Number);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${day} ${months[month - 1]} ${year}`;
  }

  protected trackBlock = (_: number, block: ArticleBlock): string => block.kind + JSON.stringify(block).slice(0, 48);
}
