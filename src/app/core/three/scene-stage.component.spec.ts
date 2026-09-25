import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SceneStage } from './scene-stage.component';
import { StageService } from './stage.service';

/**
 * SCENE STAGE — the degradation contract
 * ---------------------------------------------------------------------------
 * This environment has no GPU, which makes it an unusually good place to test
 * the half of the WebGL story that matters most: what the page does when the
 * stage *cannot* run.
 *
 * The contract is: mounting the stage never throws, the host always ends in a
 * defined state, the CSS fallback is always present in the markup for it to
 * fall back to, and the artifact never reports itself live when it is not.
 * A regression here would show up as a blank rectangle in a browser — the exact
 * failure mode that is hardest to notice in review.
 */
describe('SceneStage', () => {
  let fixture: ComponentFixture<SceneStage>;
  let stage: StageService;
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    // jsdom has no canvas implementation and logs a "not implemented" warning
    // for every probe. Stubbing it to `null` states the same fact — there is no
    // context here — without the noise, and pins the capability probe itself as
    // part of the contract under test.
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function stubGetContext(): null {
      return null;
    } as typeof HTMLCanvasElement.prototype.getContext;

    TestBed.configureTestingModule({ imports: [SceneStage] });
    fixture = TestBed.createComponent(SceneStage);
    stage = TestBed.inject(StageService);
    fixture.detectChanges();
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    fixture.destroy();
    ScrollTrigger.killAll();
    gsap.globalTimeline.clear();
    gsap.ticker.sleep();
    delete document.documentElement.dataset['motion'];
  });

  it('renders the canvas and the CSS fallback together', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('canvas.stage__canvas')).toBeTruthy();
    // The fallback has to be in the DOM from the start: it is what shows when
    // WebGL is unavailable, and it must not depend on JavaScript to appear.
    expect(host.querySelectorAll('.stage__orb')).toHaveLength(3);
    expect(host.querySelector('.stage__canvas')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('settles into a defined state without a GPU, and reports it honestly', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const state = (fixture.nativeElement as HTMLElement).dataset['stage'];
    expect(['fallback', 'live', 'idle']).toContain(state);

    // `live` is the signal other components read; it must agree with the host.
    expect(stage.live()).toBe(state === 'live');
  });

  it('takes the artifact off screen but leaves the rest pose clean on destroy', () => {
    fixture.detectChanges();
    fixture.destroy();

    expect((fixture.nativeElement as HTMLElement).dataset['stage']).toBe('idle');
    expect(stage.live()).toBe(false);
    // A stale pose from a previous route would be inherited by the next one.
    expect(stage.params.x).toBe(0);
    expect(stage.params.opacity).toBe(1);
  });
});
