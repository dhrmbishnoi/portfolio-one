import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { SmoothScrollService } from '../../core/services/smooth-scroll.service';
import { SceneStage } from '../../core/three/scene-stage.component';
import { ScrollChrome } from '../../shared/components/scroll-chrome/scroll-chrome.component';
import { Hero } from './hero/hero.component';
import { SelectedWork } from './selected-work/selected-work.component';
import { SystemsSection } from './systems-section/systems-section.component';
import { Principles } from './principles/principles.component';
import { Method } from './method/method.component';
import { ContactCta } from './contact-cta/contact-cta.component';
import { Story } from './story/story.component';

/**
 * HOME
 * ---------------------------------------------------------------------------
 * The scroll story, in six movements:
 *
 *   00 hero      — the claim, and the artifact arrives
 *   01 story     — four pinned chapters, the artifact morphs with the argument
 *   02 work      — three case studies as glass instruments
 *   03 systems   — the daylight interlude: what the work is made of
 *   04 method    — a pinned horizontal lifecycle
 *   05 contact   — the artifact becomes the horizon and the invitation
 *
 * Each section owns its own choreography and writes directly to the shared
 * WebGL pose, so the artifact is continuous across the whole page even though
 * six different components are driving it.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    SceneStage,
    ScrollChrome,
    Hero,
    Story,
    SelectedWork,
    SystemsSection,
    Principles,
    Method,
    ContactCta,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly scroll = inject(SmoothScrollService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // The narrative is scroll-driven, so the document needs the smooth scroller
    // before the first pinned timeline measures itself.
    this.scroll.initialise();
    this.destroyRef.onDestroy(() => this.scroll.resize());
  }
}
