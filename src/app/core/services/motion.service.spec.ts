import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestBed } from '@angular/core/testing';
import { MotionService } from './motion.service';

/** Install a `prefers-reduced-motion` answer before the service is constructed. */
function withReducedMotion(reduced: boolean) {
  const listeners: Array<(event: { matches: boolean }) => void> = [];
  const query = {
    matches: reduced,
    addEventListener: (_: string, fn: (event: { matches: boolean }) => void) =>
      listeners.push(fn),
    removeEventListener: () => undefined,
  };

  vi.stubGlobal('matchMedia', () => query);

  TestBed.configureTestingModule({ providers: [MotionService] });
  const service = TestBed.inject(MotionService);

  return {
    service,
    /** Simulate the user flipping the OS preference at runtime. */
    change(next: boolean) {
      listeners.forEach((fn) => fn({ matches: next }));
    },
  };
}

describe('MotionService', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('allows motion when the preference is not set', () => {
    const { service } = withReducedMotion(false);
    expect(service.reducedMotion()).toBe(false);
    expect(service.motionAllowed()).toBe(true);
  });

  it('refuses motion when the user prefers reduced motion', () => {
    const { service } = withReducedMotion(true);
    expect(service.reducedMotion()).toBe(true);
    expect(service.motionAllowed()).toBe(false);
  });

  it('hands out disabled scopes under reduced motion', () => {
    const { service } = withReducedMotion(true);
    const scope = service.scope(document.createElement('div'));
    expect(scope.enabled).toBe(false);
  });

  it('never runs a reveal on a disabled scope', () => {
    const { service } = withReducedMotion(true);
    const scope = service.scope(document.createElement('div'));
    const target = document.createElement('div');

    scope.run(() => {
      throw new Error('run() must not execute when motion is reduced');
    });
    scope.reveal(target, 'rise');

    // The element must be left exactly as the stylesheet left it.
    expect(target.style.opacity).toBe('');
    expect(target.style.transform).toBe('');
  });

  it('runs the build function on an enabled scope', () => {
    const { service } = withReducedMotion(false);
    const scope = service.scope(document.createElement('div'));
    let ran = false;
    scope.run(() => {
      ran = true;
    });
    expect(ran).toBe(true);
    expect(scope.revert).toBeTypeOf('function');
    scope.revert();
  });

  it('reacts to the preference changing at runtime', () => {
    const { service, change } = withReducedMotion(false);
    expect(service.motionAllowed()).toBe(true);

    change(true);
    expect(service.reducedMotion()).toBe(true);
    expect(service.motionAllowed()).toBe(false);

    change(false);
    expect(service.reducedMotion()).toBe(false);
    expect(service.motionAllowed()).toBe(true);
  });

  it('treats a null matchMedia result as "motion allowed"', () => {
    // The service guards against environments where the query cannot be built;
    // GSAP itself needs matchMedia, so this only covers the service's own path.
    vi.stubGlobal('matchMedia', () => null);
    TestBed.configureTestingModule({ providers: [MotionService] });
    const service = TestBed.inject(MotionService);
    expect(service.reducedMotion()).toBe(false);
    expect(service.motionAllowed()).toBe(true);
  });
});
