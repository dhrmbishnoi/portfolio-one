import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SITE } from '../../../core/config/site.config';

/**
 * TECHNICAL LOADER
 * ---------------------------------------------------------------------------
 * Not a spinner. A minimal technical panel: monogram, a status line and a thin
 * progress rule. It is rendered only while the app is genuinely initialising
 * (font faces settling, first painted frame) and never on an artificial delay,
 * so on a warm load it is never seen.
 */
@Component({
  selector: 'app-technical-loader',
  standalone: true,
  template: `
    <div
      class="loader"
      role="status"
      aria-live="polite"
      [attr.data-visible]="visible()"
      [attr.aria-hidden]="!visible()"
    >
      <div class="loader__inner">
        <p class="loader__mark" aria-hidden="true">{{ site.identity.monogram }}</p>

        <div class="loader__status">
          <p class="loader__label label">
            <span class="loader__dot" aria-hidden="true"></span>
            Initializing interface system
          </p>
          <p class="loader__value num">{{ percent() }}%</p>
        </div>

        <div class="loader__track" aria-hidden="true">
          <span class="loader__bar" [style.--progress]="progress()"></span>
        </div>

        <p class="loader__meta label">
          {{ site.identity.name }} — {{ site.identity.roleShort }}
        </p>
      </div>
    </div>
  `,
  styleUrl: './technical-loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechnicalLoader {
  protected readonly site = SITE;

  /** Whether the loader is actually covering the viewport. */
  readonly visible = input(false);

  /** 0–1 initialisation progress. */
  readonly progress = input(0);

  protected readonly percent = computed(() => Math.round(this.progress() * 100));
}
