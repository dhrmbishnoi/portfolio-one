import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CodeBlock } from './code-block.component';

describe('CodeBlock', () => {
  let fixture: ComponentFixture<CodeBlock>;

  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    writeText.mockClear();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    TestBed.configureTestingModule({ imports: [CodeBlock] });
  });

  /**
   * The copy control lives in the filename bar, which every code block in the
   * app carries — so the tests mount one the same way the templates do.
   */
  function create(code = 'const a = 1;', filename = 'sample.ts') {
    fixture = TestBed.createComponent(CodeBlock);
    fixture.componentRef.setInput('code', code);
    fixture.componentRef.setInput('filename', filename);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the filename bar and a copy control', () => {
    create('const a = 1;', 'store.ts');
    expect(fixture.nativeElement.querySelector('.code__file')?.textContent?.trim()).toBe(
      'store.ts',
    );
    expect(fixture.nativeElement.querySelector('.code__copy')).toBeTruthy();
  });

  it('omits the filename bar when no filename is given', () => {
    fixture = TestBed.createComponent(CodeBlock);
    fixture.componentRef.setInput('code', 'const a = 1;');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.code__bar')).toBeNull();
    expect(fixture.nativeElement.querySelector('.code__copy')).toBeNull();
  });

  it('highlights the code without a syntax-highlighting dependency', () => {
    create("const label = 'signals';");
    const code = fixture.nativeElement.querySelector('code') as HTMLElement;
    expect(code.textContent).toContain('const');
    expect(code.textContent).toContain('signals');
    // Token colouring is applied through spans, not a runtime library.
    expect(code.querySelectorAll('span').length).toBeGreaterThan(0);
  });

  it('escapes HTML in the sample instead of injecting it', () => {
    create('const evil = "<img src=x onerror=alert(1)>";');
    const code = fixture.nativeElement.querySelector('code') as HTMLElement;
    expect(code.querySelector('img')).toBeNull();
    expect(code.textContent).toContain('<img');
  });

  it('copies the source and shows visible feedback', async () => {
    create('const value = 42;');
    const button = fixture.nativeElement.querySelector('.code__copy') as HTMLButtonElement;

    expect(button.textContent).toContain('Copy');
    expect(button.getAttribute('data-copied')).toBe('false');

    button.click();
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('const value = 42;'));

    fixture.detectChanges();
    expect(button.textContent).toContain('Copied');
    expect(button.getAttribute('data-copied')).toBe('true');

    // The confirmation is announced, not just drawn.
    const status = fixture.nativeElement.querySelector('[role="status"]');
    expect(status?.textContent).toContain('Code copied to clipboard');
  });

  it('returns the control to its resting state after the feedback window', async () => {
    vi.useFakeTimers();
    try {
      create('let x = 1;');
      const button = fixture.nativeElement.querySelector('.code__copy') as HTMLButtonElement;
      button.click();
      await Promise.resolve();
      fixture.detectChanges();
      expect(button.getAttribute('data-copied')).toBe('true');

      vi.advanceTimersByTime(2000);
      fixture.detectChanges();
      expect(button.getAttribute('data-copied')).toBe('false');
      expect(button.textContent).toContain('Copy');
    } finally {
      vi.useRealTimers();
    }
  });

  it('stays in the resting state when the clipboard is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    create('let y = 2;');
    const button = fixture.nativeElement.querySelector('.code__copy') as HTMLButtonElement;

    button.click();
    await Promise.resolve();
    fixture.detectChanges();

    expect(writeText).not.toHaveBeenCalled();
    expect(button.getAttribute('data-copied')).toBe('false');
  });

  it('renders an optional caption', () => {
    create();
    fixture.componentRef.setInput('caption', 'Reducer boundary');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.code__caption')?.textContent?.trim()).toBe(
      'Reducer boundary',
    );
  });
});
