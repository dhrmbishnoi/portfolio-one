import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { highlight, type HighlightLanguage } from '../../lib/highlight';

/**
 * CODE BLOCK
 * ---------------------------------------------------------------------------
 * A code sample with a filename bar, a copy control and dependency-free token
 * colouring. Copy feedback is a visible state change plus an aria-live
 * announcement — never a toast.
 */
@Component({
  selector: 'app-code-block',
  standalone: true,
  template: `
    <figure class="code" [class.code--flush]="flush()">
      @if (filename()) {
        <figcaption class="code__bar">
          <span class="code__file">{{ filename() }}</span>
          <button
            type="button"
            class="code__copy"
            [attr.data-copied]="copied()"
            (click)="copy()"
          >
            <span aria-hidden="true">{{ copied() ? '✓' : '⧉' }}</span>
            {{ copied() ? 'Copied' : 'Copy' }}
          </button>
        </figcaption>
      }

      <pre tabindex="0"><code [innerHTML]="highlighted()"></code></pre>

      @if (caption()) {
        <p class="code__caption label">{{ caption() }}</p>
      }

      <span class="visually-hidden" role="status" aria-live="polite">
        {{ copied() ? 'Code copied to clipboard' : '' }}
      </span>
    </figure>
  `,
  styleUrl: './code-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeBlock {
  readonly code = input.required<string>();
  readonly language = input<HighlightLanguage>('typescript');
  readonly filename = input<string>();
  readonly caption = input<string>();
  /** Removes the outer border — used when nested inside a diagram frame. */
  readonly flush = input(false);

  readonly copied = signal(false);

  protected readonly highlighted = computed(() => highlight(this.code(), this.language()));

  protected async copy(): Promise<void> {
    const value = this.code();

    // No clipboard API (or a denied permission) must never claim success —
    // the control stays in its resting state and announces nothing.
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      this.copied.set(false);
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1800);
    } catch {
      this.copied.set(false);
    }
  }
}
