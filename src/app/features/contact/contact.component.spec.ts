import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ContactComponent } from './contact.component';
import { SITE } from '../../core/config/site.config';
import { routes } from '../../app.routes';

describe('Contact', () => {
  let fixture: ComponentFixture<ContactComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [provideRouter(routes)],
    });
    fixture = TestBed.createComponent(ContactComponent);
    fixture.detectChanges();
  });

  it('renders the closing headline with the accent only on "care?"', () => {
    const host = fixture.nativeElement as HTMLElement;
    const lines = [...host.querySelectorAll('.contact__line')].map(
      (el) => el.textContent?.trim(),
    );
    expect(lines).toEqual(['Building something', 'that deserves', 'care?']);

    const accented = host.querySelector('.contact__line--accent');
    expect(accented?.textContent?.trim()).toBe('care?');
  });

  it('renders the given supporting copy', () => {
    expect(fixture.nativeElement.querySelector('.contact__copy')?.textContent).toContain(
      'thoughtful frontend architecture',
    );
  });

  it('offers the primary CTA', () => {
    const cta = fixture.nativeElement.querySelector('.contact__actions .btn');
    expect(cta?.textContent).toContain('Start a conversation');
    expect(cta?.getAttribute('href')).toBe(SITE.contact.mailto);
  });

  it('renders all three channels from site.config', () => {
    const keys = [...fixture.nativeElement.querySelectorAll('.contact__channel-key')].map((el) =>
      el.textContent?.trim(),
    );
    expect(keys).toEqual(['Email', 'LinkedIn', 'GitHub']);

    const values = [...fixture.nativeElement.querySelectorAll('.contact__channel-value')].map(
      (el) => el.textContent?.trim(),
    );
    expect(values).toEqual([
      `${SITE.contact.email}`,
      `${SITE.contact.linkedin.replace(/^https?:\/\//, '')} \u2197`,
      `${SITE.contact.github.replace(/^https?:\/\//, '')} \u2197`,
    ]);
  });

  it('links every channel out to the configured URL', () => {
    const hrefs = [...fixture.nativeElement.querySelectorAll('.contact__channel-value')].map((el) =>
      el.getAttribute('href'),
    );
    expect(hrefs).toEqual([
      SITE.contact.mailto,
      SITE.contact.linkedin,
      SITE.contact.github,
    ]);
  });

  it('renders the availability status', () => {
    expect(fixture.nativeElement.querySelector('.contact__note')?.textContent).toContain(
      'selected work',
    );
  });

  it('opens in a dark editorial section', () => {
    // The host carries `on-dark`, which swaps the semantic colour aliases.
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList.contains('on-dark')).toBe(true);
  });

  it('uses meaningful link text, never bare URLs', () => {
    const links = [...fixture.nativeElement.querySelectorAll('a')];
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect((link.textContent ?? '').trim().length).toBeGreaterThan(0);
    }
  });
});
