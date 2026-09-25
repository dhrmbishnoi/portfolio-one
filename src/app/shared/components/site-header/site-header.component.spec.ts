import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { SiteHeader } from './site-header.component';
import { SITE } from '../../../core/config/site.config';
import { routes } from '../../../app.routes';

describe('SiteHeader', () => {
  let fixture: ComponentFixture<SiteHeader>;
  let header: SiteHeader;

  const toggle = () =>
    fixture.debugElement.query(By.css('[data-menu-toggle]')).nativeElement as HTMLButtonElement;
  const panel = () =>
    fixture.debugElement.query(By.css('[data-menu-panel]')).nativeElement as HTMLElement;

  function setScroll(y: number): void {
    window.scrollY = y;
    (header as unknown as { onScroll(): void }).onScroll();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    window.scrollY = 0;
    TestBed.configureTestingModule({
      imports: [SiteHeader],
      providers: [provideRouter(routes)],
    });
    fixture = TestBed.createComponent(SiteHeader);
    header = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the identity from site.config — nothing hardcoded in the template', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.identity__name')?.textContent?.trim()).toBe(SITE.identity.name);
    expect(host.querySelector('.identity__mark')?.textContent?.trim()).toBe(
      SITE.identity.monogram,
    );
    expect(host.querySelector('.identity__role')?.textContent?.trim()).toBe(
      SITE.identity.roleShort,
    );
  });

  it('renders exactly the five nav items in order', () => {
    const labels = [...fixture.nativeElement.querySelectorAll('.nav__link .nav__label')].map(
      (el) => el.textContent?.trim(),
    );
    expect(labels).toEqual(SITE.nav.map((item) => item.label));
  });

  it('renders the availability status', () => {
    expect(fixture.nativeElement.querySelector('.header__status-text')?.textContent?.trim()).toBe(
      SITE.identity.availability,
    );
  });

  it('starts quiet and gains the scrolled surface only after scrolling', () => {
    const el = fixture.nativeElement.querySelector('.header') as HTMLElement;
    expect(el.classList.contains('header--scrolled')).toBe(false);

    setScroll(4);
    expect(el.classList.contains('header--scrolled')).toBe(false);

    setScroll(120);
    expect(el.classList.contains('header--scrolled')).toBe(true);

    setScroll(0);
    expect(el.classList.contains('header--scrolled')).toBe(false);
  });

  describe('mobile menu', () => {
    it('is closed and inert at rest', () => {
      expect(panel().classList.contains('menu--open')).toBe(false);
      expect(panel().getAttribute('aria-hidden')).toBe('true');
      expect(panel().hasAttribute('inert')).toBe(true);
      expect(toggle().getAttribute('aria-expanded')).toBe('false');
      expect(toggle().textContent).toContain('Open menu');
    });

    it('opens with an accessible label and a visible panel', () => {
      toggle().click();
      fixture.detectChanges();

      expect(panel().classList.contains('menu--open')).toBe(true);
      expect(panel().getAttribute('aria-hidden')).toBe('false');
      expect(panel().hasAttribute('inert')).toBe(false);
      expect(toggle().getAttribute('aria-expanded')).toBe('true');
      expect(toggle().textContent).toContain('Close menu');
    });

    it('exposes the toggle to assistive tech via aria-controls', () => {
      expect(toggle().getAttribute('aria-controls')).toBe('mobile-menu');
      expect(panel().id).toBe('mobile-menu');
    });

    it('lists every nav item with its hint in the mobile panel', () => {
      toggle().click();
      fixture.detectChanges();

      const links = [...panel().querySelectorAll('.menu__link')];
      expect(links).toHaveLength(SITE.nav.length);
      links.forEach((link, index) => {
        expect(link.querySelector('.menu__label')?.textContent?.trim()).toBe(
          SITE.nav[index].label,
        );
        expect(link.querySelector('.menu__hint')?.textContent?.trim()).toBe(
          SITE.nav[index].hint,
        );
      });
    });

    it('closes when a nav item is chosen', () => {
      toggle().click();
      fixture.detectChanges();
      (panel().querySelector('.menu__link') as HTMLAnchorElement).click();
      fixture.detectChanges();

      expect(panel().classList.contains('menu--open')).toBe(false);
      expect(toggle().getAttribute('aria-expanded')).toBe('false');
    });

    it('closes on Escape and returns focus to the toggle', () => {
      toggle().click();
      fixture.detectChanges();
      expect(panel().classList.contains('menu--open')).toBe(true);

      const focusSpy = vi.spyOn(toggle(), 'focus');
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();

      expect(panel().classList.contains('menu--open')).toBe(false);
      expect(focusSpy).toHaveBeenCalled();
    });

    it('ignores keys other than Escape', () => {
      toggle().click();
      fixture.detectChanges();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      fixture.detectChanges();
      expect(panel().classList.contains('menu--open')).toBe(true);
    });
  });

  describe('active route indicator', () => {
    it('marks the matching nav link as active', async () => {
      const router = TestBed.inject(Router);
      await router.navigateByUrl('/systems');
      fixture.detectChanges();

      const active = [...fixture.nativeElement.querySelectorAll('.nav__link')].filter((el) =>
        el.classList.contains('nav__link--active'),
      );
      expect(active).toHaveLength(1);
      expect(active[0].textContent).toContain('Systems');
    });

    it('does not mark the home link on a sub-route', async () => {
      const router = TestBed.inject(Router);
      await router.navigateByUrl('/work');
      fixture.detectChanges();

      const labels = [...fixture.nativeElement.querySelectorAll('.nav__link--active')].map((el) =>
        el.querySelector('.nav__label')?.textContent?.trim(),
      );
      expect(labels).toEqual(['Work']);
    });
  });
});
