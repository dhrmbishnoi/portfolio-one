import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { gsap } from 'gsap';
import { HOME_CHAPTERS } from '../../../core/narrative';
import { SmoothScrollService } from '../../../core/services/smooth-scroll.service';

/**
 * SCROLL CHROME
 * ---------------------------------------------------------------------------
 * Two instruments that make the narrative legible while you travel through it:
 * a hairline progress bar under the header, and a chapter rail down the right
 * edge that names the section you are in and jumps between them.
 *
 * The rail only renders on wide viewports where there is margin to spare, and
 * it stays out of the tab order until it is visible and interactive.
 */
@Component({
  selector: 'app-scroll-chrome',
  standalone: true,
  template: `
    <div class="progress" aria-hidden="true">
      <span class="progress__bar" #bar></span>
    </div>

    <nav class="rail" aria-label="Chapters">
      <ol class="rail__list">
        @for (chapter of chapters; track chapter.id; let i = $index) {
          <li class="rail__item">
            <button
              type="button"
              class="rail__button"
              [class.rail__button--active]="active() === chapter.id"
              [attr.aria-current]="active() === chapter.id ? 'true' : null"
              (click)="goTo(chapter.id)"
            >
              <span class="rail__index num">{{ pad(i + 1) }}</span>
              <span class="rail__label">{{ chapter.label }}</span>
              <span class="rail__dot" aria-hidden="true"></span>
            </button>
          </li>
        }
      </ol>
    </nav>
  `,
  styleUrl: './scroll-chrome.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollChrome {
  protected readonly chapters = HOME_CHAPTERS;
  protected readonly scroll = inject(SmoothScrollService);
  private readonly barRef = viewChild.required<ElementRef<HTMLElement>>('bar');

  private readonly destroyRef = inject(DestroyRef);
  private readonly activeId = signal<string>(HOME_CHAPTERS[0]!.id);

  protected readonly active = computed(() => this.activeId());

  constructor() {
    afterNextRender(() => {
      // The bar is painted directly: subscribing to the scroll frame with a
      // quickSetter keeps the progress line off Angular's change detection.
      const setProgress = gsap.quickSetter(this.barRef().nativeElement, 'scaleX');
      const unsubscribe = this.scroll.onFrame((progress) => setProgress(progress));
      this.destroyRef.onDestroy(unsubscribe);

      if (typeof IntersectionObserver === 'undefined') {
        return;
      }

      const sections = this.chapters
        .map((chapter) => document.getElementById(chapter.id))
        .filter((element): element is HTMLElement => Boolean(element));

      if (!sections.length) {
        return;
      }

      const visible = new Map<string, number>();

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const id = entry.target.id;
            if (entry.isIntersecting) {
              visible.set(id, entry.intersectionRatio);
            } else {
              visible.delete(id);
            }
          });

          if (!visible.size) {
            return;
          }
          // The chapter occupying the most viewport wins — that is what the
          // reader is actually looking at, as opposed to what merely overlaps.
          let bestId = '';
          let bestRatio = 0;
          visible.forEach((ratio, id) => {
            if (ratio > bestRatio) {
              bestRatio = ratio;
              bestId = id;
            }
          });
          if (bestId) {
            this.activeId.set(bestId);
          }
        },
        { threshold: [0.15, 0.35, 0.6, 0.85, 1] },
      );

      sections.forEach((section) => observer.observe(section));
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected pad(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }

  protected goTo(id: string): void {
    this.scroll.scrollTo(`#${id}`, -8);
  }
}
