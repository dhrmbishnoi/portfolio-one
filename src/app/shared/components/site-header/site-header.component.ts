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

interface HeaderState {
  readonly scrolled: boolean;
  readonly menuOpen: boolean;
}

/**
 * SITE HEADER
 * ---------------------------------------------------------------------------
 * Minimal, sticky and almost editorial at rest. On scroll it gains a surface
 * shift and a thin bottom rule — no glass blur, no shadow. The active route is
 * marked with a short accent indicator; the mobile menu is a full editorial
 * panel with focus containment and Escape-to-close.
 */
@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
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
  protected readonly state = signal<HeaderState>({ scrolled: false, menuOpen: false });

  protected readonly menuLabel = computed(() =>
    this.state().menuOpen ? 'Close menu' : 'Open menu',
  );

  private readonly host = inject(ElementRef).nativeElement as HTMLElement;

  ngOnInit(): void {
    this.onScroll();
  }

  protected onScroll(): void {
    const scrolled = typeof window !== 'undefined' ? window.scrollY > 8 : false;
    if (scrolled !== this.state().scrolled) {
      this.state.update((current) => ({ ...current, scrolled }));
    }
  }

  protected toggleMenu(): void {
    this.state.update((current) => ({ ...current, menuOpen: !current.menuOpen }));
    if (this.state().menuOpen) {
      // Move focus into the panel so keyboard users are not left behind.
      requestAnimationFrame(() => {
        this.panel?.querySelector<HTMLElement>('a, button')?.focus();
      });
    }
  }

  protected closeMenu(): void {
    this.state.update((current) => ({ ...current, menuOpen: false }));
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
