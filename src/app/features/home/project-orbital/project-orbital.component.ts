import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { ORBITAL_VISUALS, type PlanItem, type PlanStatus } from '../../../core/data/projects.data';
import { MotionService, nextFrame } from '../../../core/services/motion.service';

const FILTERS: readonly { id: 'all' | PlanStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'at-risk', label: 'At risk' },
  { id: 'blocked', label: 'Blocked' },
];

/**
 * PROJECT 01 — ORBITAL
 * ---------------------------------------------------------------------------
 * Flagship presentation: a large horizontal composition. Title on the left, the
 * planning interface across the rest of the grid, technical annotations in the
 * margins. Motion reveals the timeline sequence and the UI composition; it does
 * not parallax and it does not loop.
 */
@Component({
  selector: 'app-project-orbital',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './project-orbital.component.html',
  styleUrl: './project-orbital.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectOrbital implements OnDestroy {
  private readonly host: HTMLElement = inject(ElementRef).nativeElement as HTMLElement;
  private readonly motion = inject(MotionService);
  private readonly scope = this.motion.scope(inject(ElementRef).nativeElement as HTMLElement);

  protected readonly project = {
    index: '01',
    title: 'Orbital',
    subtitle: 'Operational planning interface for complex distributed teams.',
    year: '2024',
    role: 'Lead frontend engineer — architecture, UI, delivery',
    focus: ['Angular', 'State architecture', 'Real-time UI', 'Performance', 'Accessibility'],
    problem:
      'Distributed operations teams planned shifts, capacity and dependencies across a spreadsheet, a chat thread and a legacy scheduling tool. Nothing shared a single source of truth.',
    built:
      'One planning surface: a dense timeline, a resource filter system, a status matrix and a live collaboration panel, all driven from a single normalised store.',
    technicalFocus: [
      'Signals for view state, RxJS for the server event stream',
      'Virtualised timeline rows with stable keyboard focus',
      'Domain events reconciled into a normalised store',
      'Interaction budget asserted in CI',
    ],
  };

  protected readonly visuals = ORBITAL_VISUALS;
  protected readonly filters = FILTERS;
  protected readonly hours = Array.from({ length: ORBITAL_VISUALS.windowHours }, (_, i) => i);

  protected readonly activeFilter = signal<'all' | PlanStatus>('all');
  protected readonly laneOpen = signal<string | null>('lane-core');

  protected readonly filteredLanes = computed(() =>
    this.visuals.lanes.map((lane) => ({
      ...lane,
      items: lane.items.filter((item) => this.matches(item)),
    })),
  );

  protected readonly visibleCount = computed(() =>
    this.filteredLanes().reduce((total, lane) => total + lane.items.length, 0),
  );

  protected setFilter(filter: 'all' | PlanStatus): void {
    this.activeFilter.set(filter);
  }

  protected toggleLane(id: string): void {
    this.laneOpen.update((current) => (current === id ? null : id));
  }

  protected statusLabel(status: PlanStatus): string {
    return status === 'at-risk' ? 'At risk' : status[0].toUpperCase() + status.slice(1);
  }

  protected rangeOf(item: PlanItem): string {
    const end = (item.start + item.span) % 24;
    return `${pad(item.start)}:00 — ${pad(end)}:00`;
  }

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

      // Timeline sequence: axis draws, then bars settle in left to right.
      gsap.from(root.querySelectorAll('[data-orbital-axis]'), {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 0.9,
        ease: 'power2.inOut',
        stagger: 0.05,
        scrollTrigger: { trigger: root, start: 'top 72%', once: true },
      });

      gsap.from(root.querySelectorAll('[data-orbital-bar]'), {
        opacity: 0,
        scaleX: 0.6,
        transformOrigin: 'left center',
        duration: 0.6,
        ease: 'power3.out',
        stagger: { each: 0.035, from: 'start' },
        scrollTrigger: { trigger: root, start: 'top 68%', once: true },
      });

      gsap.from(root.querySelectorAll('[data-orbital-annotation]'), {
        opacity: 0,
        x: 12,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.06,
        scrollTrigger: { trigger: root, start: 'top 60%', once: true },
      });
    });
  }

  private matches(item: PlanItem): boolean {
    const filter = this.activeFilter();
    return filter === 'all' || item.status === filter;
  }
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
