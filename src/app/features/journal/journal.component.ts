import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { JOURNAL } from '../../core/data/journal.data';
import { MotionService, nextFrame } from '../../core/services/motion.service';

/**
 * JOURNAL
 * ---------------------------------------------------------------------------
 * An editorial article list, not a blog card grid. Each row is date, title,
 * reading time and tag. Rows reveal subtly on scroll; on hover the date shifts,
 * an underline appears and the arrow moves.
 */
@Component({
  selector: 'app-journal',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './journal.component.html',
  styleUrl: './journal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalComponent implements OnDestroy {
  protected readonly articles = JOURNAL;

  private readonly host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly motion = inject(MotionService);
  private readonly scope = this.motion.scope(inject(ElementRef).nativeElement as HTMLElement);

  constructor() {
    afterNextRender(() => void this.reveal());
  }

  ngOnDestroy(): void {
    this.scope.revert();
  }

  private async reveal(): Promise<void> {
    if (!this.motion.motionAllowed()) {
      return;
    }

    await nextFrame();
    this.scope.run(() => {
      const root = this.host;

      gsap.from(root.querySelectorAll('[data-journal-row]'), {
        opacity: 0,
        y: 12,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.06,
        scrollTrigger: { trigger: root, start: 'top 80%', once: true },
      });
    });
  }

  protected formatDate(iso: string): string {
    const [year, month, day] = iso.split('-').map(Number);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${day} ${months[month - 1]} ${year}`;
  }
}
