import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SITE } from '../../../core/config/site.config';
import { MotionService } from '../../../core/services/motion.service';
import { SmoothScrollService } from '../../../core/services/smooth-scroll.service';
import { MagneticDirective } from '../../directives/magnetic.directive';

interface HeaderState {
  readonly scrolled: boolean;
  readonly hidden: boolean;
  readonly menuOpen: boolean;
}

/**
 * SITE HEADER
 * ---------------------------------------------------------------------------
 * A floating glass bar over the dark stage. It retreats as the reader descends
 * — the story is the subject, not the navigation — and returns the moment they
 * scroll back up. The mobile menu is a full-height editorial panel that locks
 * the scroller, moves focus in, and closes on Escape.
 */
@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MagneticDirective],
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:scroll)': 'onScroll()',
    '(window:keydown)': 'onKeydown($event)',
  },
})
export class SiteHeader implements OnInit {
  protected readonly site = SITE;
  protected readonly state = signal<HeaderState>({
    scrolled: false,
    hidden: false,
    menuOpen: false,
  });

  protected readonly menuLabel = computed(() => (this.state().menuOpen ? 'Close menu' : 'Open menu'));

  private readonly host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly scroll = inject(SmoothScrollService);
  private readonly motion = inject(MotionService);

  ngOnInit(): void {
    this.onScroll();
  }

  /**
   * Retreat on the way down, return on the way up. The header is translated
   * rather than removed, so it never re-enters the layout.
   *
   * Deliberately *not* an effect: the state is written from the scroll handler
   * and only when a value actually changes, so a scroll frame can never cause a
   * signal write that invalidates the thing that produced it.
   */
  protected onScroll(): void {
    const y = typeof window !== 'undefined' ? window.scrollY : 0;
    const current = this.state();
    const scrolled = y > 12;
    const hidden = this.motion.motionAllowed() && !current.menuOpen && this.scroll.direction() === 1 && y > 320;

    if (scrolled !== current.scrolled || hidden !== current.hidden) {
      this.state.update((state) => ({ ...state, scrolled, hidden }));
    }
  }

  protected toggleMenu(): void {
    const open = !this.state().menuOpen;
    this.state.update((current) => ({ ...current, menuOpen: open, hidden: false }));
    if (open) {
      this.scroll.stop();
      // Move focus into the panel so keyboard users are not left behind.
      requestAnimationFrame(() => {
        this.panel?.querySelector<HTMLElement>('a, button')?.focus();
      });
    } else {
      this.scroll.start();
    }
  }

  protected closeMenu(): void {
    this.state.update((current) => ({ ...current, menuOpen: false }));
    this.scroll.start();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.state().menuOpen) {
      this.closeMenu();
      this.toggle?.focus();
    }
  }

  private get toggle(): HTMLElement | null {
    return this.host.querySelector<HTMLElement>('[data-menu-toggle]');
  }

  private get panel(): HTMLElement | null {
    return this.host.querySelector<HTMLElement>('[data-menu-panel]');
  }
}
