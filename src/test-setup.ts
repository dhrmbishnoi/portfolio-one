/**
 * TEST SETUP
 * ---------------------------------------------------------------------------
 * jsdom does not implement `window.matchMedia`, and GSAP's ScrollTrigger needs
 * it to register. Rather than guarding production code around a browser API
 * that every real browser provides, the test environment supplies a minimal,
 * controllable implementation. Tests that care about the reduced-motion
 * preference stub this with their own answer.
 */

interface Listener {
  (event: MediaQueryListEvent): void;
}

class TestMediaQueryList {
  matches: boolean;
  media: string;
  onchange: ((event: MediaQueryListEvent) => void) | null = null;

  private readonly listeners = new Set<Listener>();

  constructor(query: string, matches = false) {
    this.media = query;
    this.matches = matches;
  }

  addEventListener(_type: string, listener: Listener): void {
    this.listeners.add(listener);
  }

  removeEventListener(_type: string, listener: Listener): void {
    this.listeners.delete(listener);
  }

  dispatchEvent(event: MediaQueryListEvent): boolean {
    this.listeners.forEach((listener) => listener(event));
    return true;
  }

  addListener(listener: Listener): void {
    this.addEventListener('change', listener);
  }

  removeListener(listener: Listener): void {
    this.removeEventListener('change', listener);
  }
}

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList =>
      new TestMediaQueryList(query) as unknown as MediaQueryList,
  });
}
