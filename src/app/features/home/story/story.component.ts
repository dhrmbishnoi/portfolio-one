import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { gsap } from 'gsap';
import { STORY_CHAPTERS } from '../../../core/narrative';
import { MotionService } from '../../../core/services/motion.service';
import { StageService } from '../../../core/three/stage.service';

/**
 * STORY
 * ---------------------------------------------------------------------------
 * The storyteller. One pinned stage, four chapters, and a single scrubbed
 * timeline that drives all of it at once:
 *
 *   · the outgoing chapter lifts, blurs and fades
 *   · the incoming chapter rises into the mask
 *   · the ghost chapter number crossfades
 *   · the WebGL artifact morphs into the pose the chapter argues for
 *   · the progress bar and the instrument readout track the index
 *
 * Every scroll position equals exactly one frame of the story — the reader
 * controls the edit. Under reduced motion the pin is never created and the four
 * chapters render as a stacked, static article.
 */
@Component({
  selector: 'app-story',
  standalone: true,
  templateUrl: './story.component.html',
  styleUrl: './story.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Story implements OnDestroy {
  private readonly host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly motion = inject(MotionService);
  private readonly stage = inject(StageService);
  private readonly scope = this.motion.scope(this.host);

  protected readonly chapters = STORY_CHAPTERS;
  /**
   * Which chapter is centre-stage. The only signal the scrub writes, and only
   * when it actually changes — the chapter bodies, the meter and the ghost
   * numeral all read from it, so it has to be reactive. The progress bar does
   * not: it changes on every frame, so the timeline paints it directly instead.
   */
  protected readonly activeIndex = signal(0);
  /** True once the pinned timeline owns the layout. */
  protected readonly ready = signal(false);

  protected readonly active = computed(() => this.chapters[this.activeIndex()]!);

  private readonly progressBarRef = viewChild.required<ElementRef<HTMLElement>>('progressBar');

  constructor() {
    afterNextRender(() => this.play());
  }

  ngOnDestroy(): void {
    this.scope.revert();
    this.section?.classList.remove('story--motion');
  }

  /**
   * The element the motion register is toggled on. It must be an element *inside*
   * the template: Angular's view encapsulation stamps content attributes on
   * those, so a class added here can be targeted by this component's stylesheet.
   */
  private get section(): HTMLElement | null {
    return this.host.querySelector<HTMLElement>('.story');
  }

  protected lines(title: string): readonly string[] {
    return title.split('\n');
  }

  private play(): void {
    if (!this.motion.motionAllowed() || window.innerWidth < 640) {
      return;
    }

    const panels = Array.from(this.host.querySelectorAll<HTMLElement>('[data-story-chapter]'));
    const pin = this.host.querySelector<HTMLElement>('[data-story-pin]');
    const head = this.host.querySelector<HTMLElement>('[data-story-head]');
    const ghost = this.host.querySelector<HTMLElement>('[data-story-ghost]');
    if (!panels.length || !pin) {
      return;
    }

    const section = this.section;
    if (!section) {
      return;
    }

    this.scope.run(() => {
      section.classList.add('story--motion');
      this.ready.set(true);

      const [first, ...rest] = panels;
      // The bars are given their start value by GSAP rather than by the
      // stylesheet: a `to()` tween has to be able to read where it starts, and
      // owning that value here keeps the animation the single source of truth.
      gsap.set(this.progressBarRef().nativeElement, { scaleX: 0 });
      gsap.set(panels, { opacity: 0, y: 90, filter: 'blur(14px)' });
      gsap.set(first!, { opacity: 1, y: 0, filter: 'blur(0px)' });
      gsap.set(ghost, { opacity: 0.08 });

      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: this.host,
          start: 'top top',
          end: () => `+=${window.innerHeight * (this.chapters.length + 0.35)}`,
          scrub: 0.55,
          pin,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const index = Math.min(
              this.chapters.length - 1,
              Math.round(self.progress * (this.chapters.length - 1) * 1.06),
            );
            if (index !== this.activeIndex()) {
              this.activeIndex.set(index);
            }
          },
        },
      });

      // Chapter one settles in and hands the artifact its opening pose.
      timeline
        .to(first!, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5 }, 0.1)
        .to(head, { opacity: 0.32, y: -26, duration: 0.6 }, 0.1)
        .to(this.stage.params, { ...this.chapters[0]!.pose, duration: 0.8 }, 0.1);

      rest.forEach((panel, index) => {
        const at = index + 0.72;
        const previous = panels[index]!;
        const chapter = this.chapters[index + 1]!;

        timeline
          .to(previous, { opacity: 0, y: -70, filter: 'blur(12px)', duration: 0.42 }, at)
          .to(panel, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.48 }, at + 0.08)
          .to(this.stage.params, { ...chapter.pose, duration: 0.95 }, at)
          .fromTo(
            ghost,
            { opacity: 0, scale: 0.94 },
            { opacity: 0.1, scale: 1, duration: 0.4 },
            at + 0.1,
          );
      });

      // The progress bar is a tween target, not a signal: GSAP writes the
      // transform straight to the element, so scrubbing the story costs no
      // Angular work at all. It is added last and matched to the duration the
      // chapter choreography already established, so it tracks the story
      // exactly instead of stretching the scroll range to fit itself.
      timeline.to(
        this.progressBarRef().nativeElement,
        { scaleX: 1, duration: timeline.duration(), ease: 'none' },
        0,
      );
    });
  }
}
