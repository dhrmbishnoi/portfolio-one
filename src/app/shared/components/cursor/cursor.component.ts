import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { gsap } from 'gsap';
import { MotionService } from '../../../core/services/motion.service';

/**
 * CURSOR
 * ---------------------------------------------------------------------------
 * A small pointer instrument: a precise dot that tracks 1:1, a lagging ring
 * that scales up over anything interactive, and an optional label read from
 * `data-cursor="View"` on the target. It never replaces the native cursor on
 * touch devices, under reduced motion, or when the viewport is narrow — the
 * class that hides the system cursor is only applied once this component is
 * actually live.
 */
@Component({
  selector: 'app-cursor',
  standalone: true,
  template: `
    <div class="cursor" #cursor aria-hidden="true">
      <span class="cursor__ring" #ring></span>
      <span class="cursor__dot" #dot></span>
      <span class="cursor__label" #label></span>
    </div>
  `,
  styleUrl: './cursor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cursor {
  private readonly cursorRef = viewChild.required<ElementRef<HTMLElement>>('cursor');
  private readonly ringRef = viewChild.required<ElementRef<HTMLElement>>('ring');
  private readonly dotRef = viewChild.required<ElementRef<HTMLElement>>('dot');
  private readonly labelRef = viewChild.required<ElementRef<HTMLElement>>('label');

  private readonly motion = inject(MotionService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly label = signal('');

  private ringX: ((value: number) => void) | null = null;
  private ringY: ((value: number) => void) | null = null;
  private labelX: ((value: number) => void) | null = null;
  private labelY: ((value: number) => void) | null = null;

  constructor() {
    if (!this.motion.motionAllowed() || !this.motion.finePointer) {
      return;
    }

    afterNextRender(() => {
      const ring = this.ringRef().nativeElement;
      const dot = this.dotRef().nativeElement;
      const labelEl = this.labelRef().nativeElement;
      const ease = { duration: 0.5, ease: 'power3.out' };

      this.ringX = gsap.quickTo(ring, 'x', ease) as (value: number) => void;
      this.ringY = gsap.quickTo(ring, 'y', ease) as (value: number) => void;
      this.labelX = gsap.quickTo(labelEl, 'x', ease) as (value: number) => void;
      this.labelY = gsap.quickTo(labelEl, 'y', ease) as (value: number) => void;

      gsap.set([ring, dot, labelEl], { xPercent: -50, yPercent: -50, opacity: 0 });
      document.documentElement.dataset['cursor'] = 'custom';

      window.addEventListener('pointermove', this.onMove, { passive: true });
      document.addEventListener('pointerover', this.onOver, true);
      document.addEventListener('pointerdown', this.onDown);
      document.addEventListener('pointerup', this.onUp);
      window.addEventListener('blur', this.onLeaveWindow);

      this.destroyRef.onDestroy(() => {
        window.removeEventListener('pointermove', this.onMove);
        document.removeEventListener('pointerover', this.onOver, true);
        document.removeEventListener('pointerdown', this.onDown);
        document.removeEventListener('pointerup', this.onUp);
        window.removeEventListener('blur', this.onLeaveWindow);
        delete document.documentElement.dataset['cursor'];
        gsap.killTweensOf([ring, dot, labelEl]);
      });
    });
  }

  private readonly onMove = (event: PointerEvent): void => {
    const { clientX: x, clientY: y } = event;
    this.ringX?.(x);
    this.ringY?.(y);
    this.labelX?.(x);
    this.labelY?.(y);
    gsap.set(this.dotRef().nativeElement, { x, y, opacity: 1 });
    gsap.set(this.cursorRef().nativeElement, { opacity: 1 });
  };

  private readonly onOver = (event: PointerEvent): void => {
    const target = (event.target as Element | null)?.closest<HTMLElement>(
      'a, button, [data-cursor], input, textarea, summary',
    );
    const ring = this.ringRef().nativeElement;

    const labelEl = this.labelRef().nativeElement;

    if (!target) {
      this.label.set('');
      gsap.to(labelEl, { opacity: 0, duration: 0.25 });
      gsap.to(ring, { scale: 1, opacity: 0.65, duration: 0.35, ease: 'power3.out' });
      return;
    }

    const text = target.dataset['cursor'] ?? '';
    this.label.set(text);
    gsap.to(labelEl, { opacity: text ? 1 : 0, duration: 0.3 });
    gsap.to(ring, {
      scale: text ? 3.6 : 1.9,
      opacity: text ? 1 : 0.9,
      duration: 0.45,
      ease: 'power3.out',
    });
    gsap.to(this.dotRef().nativeElement, { scale: text ? 0 : 1, duration: 0.3 });
  };

  private readonly onDown = (): void => {
    gsap.to(this.ringRef().nativeElement, { scale: 0.82, duration: 0.2, ease: 'power2.out' });
  };

  private readonly onUp = (): void => {
    gsap.to(this.ringRef().nativeElement, { scale: 1.9, duration: 0.3, ease: 'power3.out' });
  };

  private readonly onLeaveWindow = (): void => {
    gsap.to(this.cursorRef().nativeElement, { opacity: 0, duration: 0.25 });
  };
}
