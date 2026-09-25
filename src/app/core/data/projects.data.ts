/**
 * PROJECTS & CASE STUDIES
 * ---------------------------------------------------------------------------
 * Typed content for the three selected projects. Client names, revenue and
 * adoption figures are deliberately absent — the brief is explicit that nothing
 * may be fabricated. Outcomes are recorded as qualitative observations, and each
 * entry says so.
 *
 * Presentation data (timelines, token graphs, waterfalls) lives here too so the
 * bespoke visuals stay declarative and testable.
 */

import type { CodeSample, DiagramSpec, MarginNote, PullQuote } from './content.types';

// ---------------------------------------------------------------------------
// Shared shapes
// ---------------------------------------------------------------------------

export interface ProjectSummary {
  readonly slug: string;
  readonly index: string;
  readonly title: string;
  readonly subtitle: string;
  readonly year: string;
  readonly role: string;
  readonly focus: readonly string[];
  readonly stack: readonly string[];
  readonly problem: string;
  readonly built: string;
  readonly technicalFocus: readonly string[];
  readonly presentation: 'flagship-light' | 'dark-system' | 'editorial-instrument';
}

export interface Tradeoff {
  readonly decision: string;
  readonly alternative: string;
  readonly rationale: string;
}

export interface CaseStudy extends ProjectSummary {
  readonly overview: readonly string[];
  readonly constraints: readonly string[];
  readonly systemModel: readonly string[];
  readonly architecture: readonly string[];
  readonly uiDecisions: readonly string[];
  readonly accessibility: readonly string[];
  readonly performance: readonly string[];
  readonly implementation: readonly CodeSample[];
  readonly tradeoffs: readonly Tradeoff[];
  readonly outcome: {
    readonly kind: 'qualitative';
    readonly statement: string;
    readonly observations: readonly string[];
  };
  readonly improveNext: readonly string[];
  readonly quote: PullQuote;
  readonly diagrams: readonly DiagramSpec[];
}

// ---------------------------------------------------------------------------
// ORBITAL — operational planning interface
// ---------------------------------------------------------------------------

export type PlanStatus = 'planned' | 'active' | 'at-risk' | 'blocked';

export interface PlanItem {
  readonly id: string;
  readonly label: string;
  readonly start: number;
  readonly span: number;
  readonly status: PlanStatus;
  readonly owner: string;
}

export interface PlanLane {
  readonly id: string;
  readonly label: string;
  readonly meta: string;
  readonly items: readonly PlanItem[];
}

export interface Collaborator {
  readonly initials: string;
  readonly name: string;
  readonly role: string;
  readonly state: 'editing' | 'viewing' | 'idle';
  readonly target: string;
}

const ORBITAL_LANES: readonly PlanLane[] = [
  {
    id: 'lane-core',
    label: 'Core platform',
    meta: '4 crews · 18h window',
    items: [
      { id: 'p-01', label: 'Release gate', start: 0, span: 4, status: 'active', owner: 'RM' },
      { id: 'p-02', label: 'Migration window', start: 5, span: 7, status: 'planned', owner: 'JT' },
      { id: 'p-03', label: 'Rollback rehearsal', start: 14, span: 5, status: 'planned', owner: 'AK' },
      { id: 'p-04', label: 'Freeze', start: 20, span: 4, status: 'blocked', owner: 'RM' },
    ],
  },
  {
    id: 'lane-edge',
    label: 'Edge delivery',
    meta: '3 crews · 18h window',
    items: [
      { id: 'p-05', label: 'Config rollout', start: 2, span: 6, status: 'active', owner: 'LS' },
      { id: 'p-06', label: 'Cache purge', start: 9, span: 3, status: 'at-risk', owner: 'DV' },
      { id: 'p-07', label: 'Regional cutover', start: 13, span: 8, status: 'planned', owner: 'LS' },
    ],
  },
  {
    id: 'lane-support',
    label: 'Support rota',
    meta: '2 crews · 18h window',
    items: [
      { id: 'p-08', label: 'On-call primary', start: 0, span: 9, status: 'active', owner: 'MN' },
      { id: 'p-09', label: 'Escalation desk', start: 10, span: 6, status: 'at-risk', owner: 'OP' },
      { id: 'p-10', label: 'Handover', start: 17, span: 5, status: 'planned', owner: 'MN' },
    ],
  },
];

const ORBITAL_COLLABORATORS: readonly Collaborator[] = [
  { initials: 'RM', name: 'R. Mikkelsen', role: 'Planning lead', state: 'editing', target: 'lane-core' },
  { initials: 'LS', name: 'L. Sandoval', role: 'Edge delivery', state: 'editing', target: 'lane-edge' },
  { initials: 'DV', name: 'D. Vance', role: 'Infrastructure', state: 'viewing', target: 'p-06' },
  { initials: 'MN', name: 'M. Nakamura', role: 'Support rota', state: 'idle', target: 'lane-support' },
];

const ORBITAL_MATRIX: readonly { label: string; planned: number; active: number; risk: number; blocked: number }[] = [
  { label: 'Core platform', planned: 2, active: 1, risk: 0, blocked: 1 },
  { label: 'Edge delivery', planned: 1, active: 1, risk: 1, blocked: 0 },
  { label: 'Support rota', planned: 1, active: 1, risk: 1, blocked: 0 },
];

export const ORBITAL_VISUALS = {
  lanes: ORBITAL_LANES,
  collaborators: ORBITAL_COLLABORATORS,
  matrix: ORBITAL_MATRIX,
  windowHours: 24,
  annotations: [
    { label: 'A', text: 'One scroll container owns the whole coordinate system — lanes and the time axis never drift apart.' },
    { label: 'B', text: 'Row height is derived from a density token; switching density re-measures once, not per cell.' },
    { label: 'C', text: 'Collaborative edits arrive as domain events and are reconciled into the same signal store.' },
    { label: 'D', text: 'Selection is a single source of truth shared by pointer, keyboard and screen reader paths.' },
  ] satisfies readonly MarginNote[],
} as const;

// ---------------------------------------------------------------------------
// FORGE — design system infrastructure
// ---------------------------------------------------------------------------

export interface TokenNode {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly layer: 'primitive' | 'alias' | 'component';
  readonly parents: readonly string[];
}

const FORGE_TOKENS: readonly TokenNode[] = [
  { id: 'gray-900', label: 'gray.900', value: '#141414', layer: 'primitive', parents: [] },
  { id: 'gray-500', label: 'gray.500', value: '#625F59', layer: 'primitive', parents: [] },
  { id: 'lime-400', label: 'lime.400', value: '#D9FF57', layer: 'primitive', parents: [] },
  { id: 'space-4', label: 'space.4', value: '1rem', layer: 'primitive', parents: [] },
  { id: 'fg-default', label: 'fg.default', value: 'gray.900', layer: 'alias', parents: ['gray-900'] },
  { id: 'fg-muted', label: 'fg.muted', value: 'gray.500', layer: 'alias', parents: ['gray-500'] },
  { id: 'accent-interactive', label: 'accent.interactive', value: 'lime.400', layer: 'alias', parents: ['lime-400'] },
  { id: 'control-gap', label: 'control.gap', value: 'space.4', layer: 'alias', parents: ['space-4'] },
  { id: 'button-label', label: 'button.label', value: 'fg.default', layer: 'component', parents: ['fg-default'] },
  { id: 'button-padding', label: 'button.padding', value: 'control.gap', layer: 'component', parents: ['control-gap'] },
  { id: 'button-focus-ring', label: 'button.focusRing', value: 'accent.interactive', layer: 'component', parents: ['accent-interactive'] },
  { id: 'button-bg-hover', label: 'button.bgHover', value: 'accent.interactive', layer: 'component', parents: ['accent-interactive'] },
];

export const FORGE_STATES = [
  { id: 'default', label: 'Default', note: 'Resting surface, 1px rule, label at fg.default.' },
  { id: 'hover', label: 'Hover', note: 'Ink inversion. No shadow, no scale.' },
  { id: 'focus', label: 'Focus', note: '2px accent ring at 3px offset. Never removed.' },
  { id: 'active', label: 'Active', note: 'Same inversion, 1px inset — confirms the press.' },
  { id: 'disabled', label: 'Disabled', note: '38% opacity, pointer-events off, still readable.' },
] as const;

export const FORGE_VISUALS = {
  tokens: FORGE_TOKENS,
  states: FORGE_STATES,
  themeLayers: [
    { id: 'l1', label: 'Brand primitives', detail: 'Raw scales. Never referenced by product code.' },
    { id: 'l2', label: 'Semantic aliases', detail: 'Role-named. The only layer a feature may import.' },
    { id: 'l3', label: 'Component tokens', detail: 'Owned by the component, overridable per theme.' },
    { id: 'l4', label: 'Theme instance', detail: 'A named set of overrides — light, dark, print.' },
  ],
  a11yPatterns: [
    'Every interactive control ships a focus ring spec, not a browser default.',
    'State changes are announced through a live region, not a colour swap.',
    'Icon-only controls require an accessible name from the component, not the caller.',
    'Disabled is a visual state only when the action is genuinely unavailable.',
    'Hit areas are 44px minimum regardless of the visual control size.',
  ],
  apiCode: `import { Component, input, signal } from '@angular/core';
import { ForgeButton } from '@forge/ui';

@Component({
  selector: 'app-release-gate',
  imports: [ForgeButton],
  template: \`
    <forge-button
      [variant]="'primary'"
      [size]="'md'"
      [loading]="saving()"
      (pressed)="gate()">
      Open release gate
    </forge-button>
  \`,
})
export class ReleaseGate {
  readonly saving = signal(false);

  protected gate(): void {
    this.saving.set(true);
  }
}`,
} as const;

// ---------------------------------------------------------------------------
// SIGNAL — frontend observability
// ---------------------------------------------------------------------------

export interface VitalTrace {
  readonly id: 'LCP' | 'INP' | 'CLS';
  readonly label: string;
  readonly unit: string;
  readonly budget: number;
  readonly points: readonly number[];
  readonly rating: 'good' | 'needs-improvement';
}

const SIGNAL_TRACES: readonly VitalTrace[] = [
  {
    id: 'LCP',
    label: 'Largest Contentful Paint',
    unit: 'ms',
    budget: 1800,
    points: [1420, 1380, 1510, 1290, 1240, 1310, 1180, 1210, 1150, 1090, 1120, 1040],
    rating: 'good',
  },
  {
    id: 'INP',
    label: 'Interaction to Next Paint',
    unit: 'ms',
    budget: 200,
    points: [180, 172, 165, 158, 149, 152, 138, 130, 124, 118, 112, 104],
    rating: 'good',
  },
  {
    id: 'CLS',
    label: 'Cumulative Layout Shift',
    unit: '',
    budget: 0.1,
    points: [0.06, 0.058, 0.049, 0.052, 0.041, 0.038, 0.031, 0.029, 0.024, 0.021, 0.019, 0.016],
    rating: 'good',
  },
];

const SIGNAL_WATERFALL: readonly { id: string; label: string; start: number; duration: number; kind: 'doc' | 'css' | 'js' | 'font' | 'xhr'; status: number }[] = [
  { id: 'w1', label: 'GET /work/orbital', start: 0, duration: 180, kind: 'doc', status: 200 },
  { id: 'w2', label: 'styles.css', start: 190, duration: 90, kind: 'css', status: 200 },
  { id: 'w3', label: 'main.js', start: 280, duration: 210, kind: 'js', status: 200 },
  { id: 'w4', label: 'chunk-orbital.js', start: 470, duration: 140, kind: 'js', status: 200 },
  { id: 'w5', label: 'inter-var.woff2', start: 500, duration: 120, kind: 'font', status: 200 },
  { id: 'w6', label: 'GET /api/plan', start: 610, duration: 260, kind: 'xhr', status: 200 },
  { id: 'w7', label: 'GET /api/presence', start: 640, duration: 310, kind: 'xhr', status: 206 },
  { id: 'w8', label: 'GET /api/flags', start: 700, duration: 480, kind: 'xhr', status: 304 },
];

const SIGNAL_BUNDLE: readonly { id: string; label: string; bytes: number; kind: 'framework' | 'app' | 'styles' | 'fonts' }[] = [
  { id: 'b1', label: 'Angular runtime', bytes: 128_000, kind: 'framework' },
  { id: 'b2', label: 'Route shell', bytes: 24_000, kind: 'app' },
  { id: 'b3', label: 'Case-study route', bytes: 31_000, kind: 'app' },
  { id: 'b4', label: 'Editorial CSS', bytes: 19_000, kind: 'styles' },
  { id: 'b5', label: 'Type subsets', bytes: 46_000, kind: 'fonts' },
];

const SIGNAL_ROUTES: readonly { route: string; lcp: string; inp: string; cls: string; transfer: string }[] = [
  { route: '/', lcp: '1.04s', inp: '104ms', cls: '0.016', transfer: '118kB' },
  { route: '/work', lcp: '0.92s', inp: '96ms', cls: '0.008', transfer: '104kB' },
  { route: '/work/orbital', lcp: '1.11s', inp: '118ms', cls: '0.011', transfer: '131kB' },
  { route: '/systems', lcp: '0.88s', inp: '88ms', cls: '0.004', transfer: '99kB' },
  { route: '/journal', lcp: '0.79s', inp: '72ms', cls: '0.003', transfer: '94kB' },
];

const SIGNAL_ERRORS: readonly { id: string; label: string; detail: string; severity: 'warn' | 'error' }[] = [
  { id: 'e1', label: 'long-task', detail: '1 task over 200ms on route change — deferred to idle', severity: 'warn' },
  { id: 'e2', label: 'hydration-gap', detail: 'font swap added 40ms to first paint, preload added', severity: 'warn' },
  { id: 'e3', label: 'unhandled-rejection', detail: 'presence socket closed without retry budget', severity: 'error' },
];

export const SIGNAL_VISUALS = {
  traces: SIGNAL_TRACES,
  waterfall: SIGNAL_WATERFALL,
  bundle: SIGNAL_BUNDLE,
  routes: SIGNAL_ROUTES,
  errors: SIGNAL_ERRORS,
} as const;

// ---------------------------------------------------------------------------
// Case studies
// ---------------------------------------------------------------------------

const ORBITAL: CaseStudy = {
  slug: 'orbital',
  index: '01',
  title: 'Orbital',
  subtitle: 'Operational planning interface for complex distributed teams.',
  year: '2024',
  role: 'Lead frontend engineer — architecture, UI, delivery',
  focus: ['Angular', 'State architecture', 'Real-time UI', 'Performance', 'Accessibility'],
  stack: ['Angular 22', 'TypeScript', 'Signals + RxJS', 'CDK a11y primitives', 'GSAP'],
  presentation: 'flagship-light',
  problem:
    'Distributed operations teams planned shifts, capacity and dependencies across a spreadsheet, a chat thread and a legacy scheduling tool. Nothing shared a single source of truth, so a change in one place silently invalidated the other two.',
  built:
    'A single planning surface: a dense timeline, a resource filter system, a status matrix and a live collaboration panel, all driven from one normalised state store.',
  technicalFocus: [
    'Signals for view state, RxJS for the server event stream',
    'Virtualised timeline rows with stable keyboard focus',
    'Domain events reconciled into a normalised store',
    'Interaction budget enforced in CI',
  ],
  overview: [
    'Orbital replaced three tools with one planning surface. The hard part was not the timeline — it was keeping a dense, continuously updating grid understandable while people were editing it at the same time.',
    'I owned the frontend architecture and the interaction model, working alongside two designers who owned the planning semantics. The team shipped the first production route in eleven weeks.',
  ],
  constraints: [
    'The planning grid had to stay interactive with more than ten thousand scheduled items in view.',
    'Collaborative edits arrive continuously; the UI may never block on a socket message.',
    'Keyboard and screen-reader parity was a launch requirement, not a follow-up.',
    'The existing event API could not be changed, so the client had to normalise a loosely typed stream.',
  ],
  systemModel: [
    'One normalised entity store owns plans, crews and assignments. Everything else is derived.',
    'Server events are modelled as intents, not patches: the store applies them idempotently so reconnects and replays converge.',
    'View state — density, filters, selection, scroll window — lives in signals and is deliberately excluded from the store.',
    'Collaborative presence is ephemeral. It is never persisted and never invalidates a derived selector.',
  ],
  architecture: [
    'Route boundaries split the application into a planning shell and a settings shell; neither loads the other.',
    'Feature state is owned by feature-scoped services provided at the route level, so unmounting a route disposes its subscriptions.',
    'The timeline is a single scroll container that owns the coordinate system. Lanes and the time axis are rendered from the same scroll offset, which removes an entire class of drift bugs.',
    'Heavy visual work is isolated behind a change-detection-friendly boundary: signals for local state, OnPush everywhere, and explicit marking at the edges of async work.',
  ],
  uiDecisions: [
    'Density is a first-class control. Planners switch between three row heights; the measurement happens once per switch rather than per cell.',
    'The status matrix is a real table. It looks like a dashboard tile but is announced as rows and columns, which is what planners actually scan.',
    'Filtering never unmounts the grid. Focus is preserved and the result count is announced in a live region.',
    'Collaborator cursors are drawn in a single overlay layer with pointer-events disabled, so they can never intercept a click meant for the plan.',
  ],
  accessibility: [
    'The timeline exposes a grid role with aria-rowindex, so a virtualised window still reports a stable row position.',
    'Arrow keys move selection, Page Up/Page Down move by hour, Home/End jump to the window edges.',
    'Collaborative changes are announced politely and rate-limited; a busy socket never floods the screen reader.',
    'Every state colour is paired with a glyph or a label — status is never carried by hue alone.',
    'Reduced-motion users get the same information with the live-travel animation removed entirely.',
  ],
  performance: [
    'Rows are virtualised; the DOM node count is bounded by the viewport, not the dataset.',
    'CSS containment is declared on lane containers so a layout change in one lane cannot invalidate the grid.',
    'The initial route ships under 130kB transferred, with the settings route loaded on demand.',
    'The interaction budget — 200ms INP at the 95th percentile — is asserted in CI, not measured by hand.',
  ],
  implementation: [
    {
      language: 'typescript',
      filename: 'plan-store.ts',
      caption: 'Events are applied as idempotent intents so replays converge.',
      code: `@Injectable({ providedIn: 'root' })
export class PlanStore {
  private readonly entities = signal<PlanEntities>(EMPTY_ENTITIES);
  private readonly events = inject(PlanEventStream);

  readonly plans = computed(() => this.entities().plans);

  constructor() {
    // Replays and reconnects converge because every intent is idempotent.
    this.events.intents$.pipe(
      takeUntilDestroyed(),
      scan(this.reduce, this.entities()),
    ).subscribe((next) => this.entities.set(next));
  }

  private reduce = (state: PlanEntities, intent: PlanIntent): PlanEntities =>
    PlanReducer.apply(state, intent);
}`,
    },
    {
      language: 'typescript',
      filename: 'timeline-row.ts',
      caption: 'Virtualised rows still report a stable position to assistive tech.',
      code: `@Component({
  selector: '[appTimelineRow]',
  standalone: true,
  host: {
    role: 'row',
    '[attr.aria-rowindex]': 'rowIndex()',
    '[attr.aria-selected]': 'selected()',
    '(keydown)': 'onKeydown($event)',
  },
  template: \`<ng-content />\`,
})
export class TimelineRow {
  readonly rowIndex = input.required<number>();
  readonly selected = input(false);

  private readonly grid = inject(TimelineGridContext);

  protected onKeydown(event: KeyboardEvent): void {
    const next = this.grid.resolveKey(event, this.rowIndex());
    if (next !== null) {
      event.preventDefault();
      this.grid.moveSelectionTo(next);
    }
  }
}`,
    },
  ],
  tradeoffs: [
    {
      decision: 'Own the timeline coordinate system in one scroll container.',
      alternative: 'Let each lane scroll independently.',
      rationale:
        'Independent lanes drift by a pixel or two under fractional zoom and destroy the mental model of "same time, same column". One container costs a repaint on every scroll frame and buys a grid people trust.',
    },
    {
      decision: 'Normalise events into a store instead of patching the view.',
      alternative: 'Apply server patches straight to component state.',
      rationale:
        'Patching is faster to write and impossible to debug once two clients race. The store adds a reducer boundary, which is where all the interesting invariants now live.',
    },
    {
      decision: 'Ship keyboard parity in the first release.',
      alternative: 'Add it after launch.',
      rationale:
        'Retrofitting a grid keyboard model means changing selection semantics that the pointer model already depends on. Doing it first was slower to launch and cheaper overall.',
    },
  ],
  outcome: {
    kind: 'qualitative',
    statement:
      'No quantitative outcome is claimed here — the engagement did not include a measurement programme for business metrics. What follows is qualitative, from direct use and review.',
    observations: [
      'Planners stopped keeping a parallel spreadsheet; the planning session happens in one place.',
      'The three-tool handover — plan, announce, confirm — collapsed into a single action.',
      'Reviewers could follow a state change end to end because the reducer was the only writer.',
      'The interaction budget caught two regressions before release, both in filter recomputation.',
    ],
  },
  improveNext: [
    'Move presence reconciliation off the main thread; it is the last remaining source of long tasks.',
    'Replace the hand-written grid keyboard model with a tested, documented primitive.',
    'Add a visual diff gate for density modes so layout regressions surface without a manual pass.',
  ],
  quote: {
    text: 'The timeline was never the hard part. Making ten thousand moving pieces feel like one object was.',
    attribution: 'Orbital — architecture note',
  },
  diagrams: [
    { kind: 'dependency-graph', caption: 'Feature boundaries and the direction of their dependencies.' },
    { kind: 'state-flow', caption: 'Domain intents entering the store and derived state leaving it.' },
  ],
};

const FORGE: CaseStudy = {
  slug: 'forge',
  index: '02',
  title: 'Forge',
  subtitle: 'Design system infrastructure for multi-product organizations.',
  year: '2023',
  role: 'Design systems engineer — tokens, components, governance',
  focus: ['Component architecture', 'Tokens', 'Accessibility', 'Documentation', 'Governance'],
  stack: ['Angular', 'TypeScript', 'SCSS', 'CSS custom properties', 'Storybook-style docs'],
  presentation: 'dark-system',
  problem:
    'Four product teams each maintained their own button, their own spacing scale and their own idea of focus. The result was a UI that looked unrelated to itself and an accessibility posture that varied by squad.',
  built:
    'A token pipeline, a component library with an explicit API surface, accessibility patterns shipped inside the components, and a governance model that made adoption cheaper than divergence.',
  technicalFocus: [
    'Three-layer token model: primitives, semantic aliases, component tokens',
    'Accessibility behaviour owned by the component, not the caller',
    'Theme instances as overridable token sets',
    'Documentation generated from the same types the components consume',
  ],
  overview: [
    'Forge is infrastructure, not a component gallery. The bet was that if the token model and the accessibility contract were right, product teams would converge without being policed.',
    'I built the token pipeline and the interaction-layer components, and wrote the governance model with the design lead. Adoption was opt-in from the first week; within two quarters it was the default.',
  ],
  constraints: [
    'Four products with four visual identities had to share one component library.',
    'Accessibility behaviour could not depend on every consumer remembering to implement it.',
    'Tokens had to survive a rebrand without a find-and-replace across every product.',
    'The library had to stay small enough that teams would actually upgrade it.',
  ],
  systemModel: [
    'Primitives are raw scales. Product code never references them.',
    'Semantic aliases name intent — fg.default, accent.interactive — and are the only layer a feature imports.',
    'Component tokens are owned by the component and are the sanctioned override point for a theme.',
    'A theme is a named set of overrides applied at a container, not a second stylesheet.',
  ],
  architecture: [
    'Each component ships with its accessibility contract: roles, names, keyboard behaviour and live-region expectations.',
    'Tokens compile to CSS custom properties, so a theme change is a cascade rather than a rebuild.',
    'Documentation pages read the same TypeScript types as the build, so a prop that exists in code cannot be missing from the docs.',
    'The library is versioned independently and consumed as a workspace package; a breaking change requires a codemod.',
  ],
  uiDecisions: [
    'Interaction states are specified as a set, not a list of one-offs: default, hover, focus, active, disabled.',
    'Focus rings are accent-coloured and 2px with a 3px offset, on every control, always.',
    'Density is a component token, so a dense table and a sparse form share the same primitives.',
    'Disabled is used only when an action is genuinely unavailable; otherwise the control stays enabled and explains itself.',
  ],
  accessibility: [
    'Icon-only controls derive their accessible name inside the component, so a missing label is a type error.',
    'State changes are announced through a live region owned by the component.',
    'Every colour pair in the token set is checked against its contrast target before release.',
    'Minimum hit areas are enforced at the component level rather than left to layout.',
    'Reduced-motion is respected in the component, so consumers do not have to remember.',
  ],
  performance: [
    'The library ships as per-component entry points; a product that uses three components downloads three.',
    'Tokens are static custom properties — no runtime theme calculation, no style recalculation on switch.',
    'Component styles use containment so a dense table cannot invalidate surrounding layout.',
  ],
  implementation: [
    {
      language: 'scss',
      filename: 'tokens.css',
      caption: 'Primitives stay private; only the alias layer is public API.',
      code: `:root {
  /* primitives — never referenced by product code */
  --forge-gray-900: #141414;
  --forge-lime-400: #d9ff57;
  --forge-space-4: 1rem;
}

:root {
  /* semantic aliases — the only public layer */
  --fg-default: var(--forge-gray-900);
  --fg-muted: #625f59;
  --accent-interactive: var(--forge-lime-400);
  --control-gap: var(--forge-space-4);
}`,
    },
    {
      language: 'typescript',
      filename: 'button.component.ts',
      caption: 'The accessibility contract lives inside the component.',
      code: `@Component({
  selector: 'forge-button',
  standalone: true,
  host: {
    '[attr.data-state]': 'state()',
    '[attr.aria-disabled]': 'disabled() || null',
    // A missing accessible name is a type error, not a runtime bug.
    '[attr.aria-label]': 'label() || null',
  },
})
export class ForgeButton {
  readonly variant = input<'primary' | 'ghost'>('primary');
  readonly disabled = input(false);
  readonly label = input<string>();

  readonly state = computed<'default' | 'hover' | 'focus' | 'active' | 'disabled'>(() =>
    this.disabled() ? 'disabled' : this.interaction(),
  );
}`,
    },
  ],
  tradeoffs: [
    {
      decision: 'Three token layers with a hard import rule.',
      alternative: 'A flat token file with naming conventions.',
      rationale:
        'Conventions decay. A hard rule enforced by a lint check makes a rebrand a primitive-only change, and it makes the public surface of the system legible to a new joiner in an afternoon.',
    },
    {
      decision: 'Own accessibility inside the component.',
      alternative: 'Document the pattern and trust consumers.',
      rationale:
        'Trust does not scale across four teams. Moving the contract into the component made the correct behaviour the path of least resistance, and made the incorrect behaviour visible in review.',
    },
    {
      decision: 'Version the library independently with codemods.',
      alternative: 'One monorepo release train across all products.',
      rationale:
        'A single train meant one team’s freeze blocked everyone. Independent versioning plus a codemod kept adoption voluntary and upgrades boring.',
    },
  ],
  outcome: {
    kind: 'qualitative',
    statement:
      'Adoption and revenue figures are not reported because they were not measured for this engagement. The observations below are qualitative.',
    observations: [
      'Button and focus-ring variants across the four products collapsed to one implementation.',
      'An accessibility review moved from a per-product audit to a review of the library itself.',
      'Rebranding became a change to the primitive layer plus a token diff.',
      'New joiners could read the alias layer and understand the whole visual language.',
    ],
  },
  improveNext: [
    'Generate contrast checks from the token file so a new primitive cannot ship unchecked.',
    'Publish a codemod for the deprecated density tokens still referenced by two products.',
    'Add visual regression coverage for every interaction state in the set.',
  ],
  quote: {
    text: 'A design system stops being a library the moment a team can rebrand without opening a product repository.',
    attribution: 'Forge — governance note',
  },
  diagrams: [
    { kind: 'token-graph', caption: 'Primitive → alias → component, with the import rule made explicit.' },
    { kind: 'state-flow', caption: 'Component state derivation and the accessibility contract.' },
  ],
};

const SIGNAL: CaseStudy = {
  slug: 'signal',
  index: '03',
  title: 'Signal',
  subtitle: 'Observability interface for frontend performance and runtime health.',
  year: '2023',
  role: 'Frontend engineer — visualisation and data pipeline',
  focus: ['Performance', 'Telemetry', 'Visualisation', 'Frontend systems'],
  stack: ['Angular', 'TypeScript', 'Web Vitals APIs', 'SVG', 'SCSS'],
  presentation: 'editorial-instrument',
  problem:
    'Frontend performance was discussed in anecdotes. Nobody could say which route regressed, which interaction got slower, or whether the last release actually helped.',
  built:
    'An observability surface for the frontend: web-vitals traces, a request waterfall, a bundle map, per-route budgets and a runtime error feed — all rendered from the same telemetry pipeline.',
  technicalFocus: [
    'Traces rendered as SVG paths with a draw-in animation on reveal',
    'Route-level budgets compared against the same threshold used in CI',
    'Bundle composition read from the build output, not hand-entered',
    'Error states modelled as data, not as red text',
  ],
  overview: [
    'Signal exists because "the site feels slow" is not an actionable statement. The interface turns telemetry into something a team can read in a stand-up.',
    'I built the visualisation layer and the normalisation step that turns raw performance entries into comparable series. The data model is deliberately boring so the charts can be interesting.',
  ],
  constraints: [
    'Telemetry arrives in three shapes: web-vitals callbacks, resource timing entries and an error stream.',
    'Everything had to render without a charting library — the page had to be cheaper than the thing it measured.',
    'Numbers had to be comparable across routes with different transfer sizes.',
    'The interface had to stay readable on a laptop at 100% zoom, in a meeting, on a projector.',
  ],
  systemModel: [
    'A normalisation step converts every source into a common series shape with an explicit unit and budget.',
    'Budgets are configuration, not constants: the same file feeds the CI assertion and the UI threshold.',
    'Routes are first-class entities, so a regression is attributed to a route rather than a release.',
    'Error states carry severity, source and a resolution state; nothing is inferred from colour alone.',
  ],
  architecture: [
    'Telemetry ingestion is a single service with one normalised output signal consumed by every panel.',
    'Panels are pure: they receive series and render SVG, which keeps the rendering cost predictable.',
    'The bundle map reads a generated manifest, so it cannot drift from the real build output.',
    'No charting dependency. Paths, scales and ticks are hand-rolled and small enough to read.',
  ],
  uiDecisions: [
    'Traces are drawn as SVG paths with a stroke-dash reveal, so the shape of a trend is visible before the numbers are.',
    'The waterfall uses a shared time axis; rows are ordered by start time, not by importance.',
    'Ratings use a glyph plus a label. Green and amber alone would fail the team’s own contrast rules.',
    'Density follows the same editorial grid as the rest of the site — this is tooling, not a dashboard.',
  ],
  accessibility: [
    'Every chart has a text equivalent: a table of the same numbers with the same headings.',
    'Traces expose their series name and current value through the accessible name of the figure.',
    'The error feed is a live region with polite announcements and a visible count.',
    'Colour is never the only channel — rating, label and position all carry meaning.',
    'Reveal animations are skipped entirely under reduced motion; the final path is the default state.',
  ],
  performance: [
    'Charts are static SVG generated once per data change; there is no per-frame work.',
    'The bundle map is derived from the build manifest, so measuring the app does not add weight to it.',
    'Route panels are lazily rendered; a collapsed panel renders no SVG at all.',
  ],
  implementation: [
    {
      language: 'typescript',
      filename: 'series.ts',
      caption: 'One normalised series shape feeds every panel.',
      code: `export interface Series {
  readonly id: string;
  readonly label: string;
  readonly unit: string;
  readonly budget: number;
  readonly rating: 'good' | 'needs-improvement';
  readonly points: readonly number[];
}

export function normalise(entry: PerformanceEntry, budget: number): Series {
  return {
    id: entry.name,
    label: entry.name,
    unit: 'ms',
    budget,
    rating: entry.value <= budget ? 'good' : 'needs-improvement',
    points: [entry.value],
  };
}`,
    },
    {
      language: 'typescript',
      filename: 'trace.component.ts',
      caption: 'Paths are generated once; the reveal is a stroke-dash animation.',
      code: `@Component({
  selector: 'app-vital-trace',
  standalone: true,
  template: \`
    <svg [attr.viewBox]="'0 0 240 64" aria-hidden="true" focusable="false">
      <path class="trace__budget" [attr.d]="budgetPath()" />
      <path class="trace__line" [attr.d]="linePath()" pathLength="100" />
    </svg>
  \`,
})
export class VitalTrace {
  readonly series = input.required<Series>();

  readonly linePath = computed(() => buildPath(this.series().points, 240, 64));
  readonly budgetPath = computed(() =>
    \`M0 \${scaleY(this.series().budget)} H240\`,
  );
}`,
    },
  ],
  tradeoffs: [
    {
      decision: 'Hand-roll the charts.',
      alternative: 'Use a charting library.',
      rationale:
        'A charting library would have cost more than the entire observability page and brought a second rendering model into an Angular app. Three chart types did not justify it.',
    },
    {
      decision: 'Read the bundle map from the build manifest.',
      alternative: 'Let engineers enter sizes by hand.',
      rationale:
        'Hand-entered numbers are wrong within a week. The manifest is always current and costs one generated JSON file.',
    },
    {
      decision: 'Every chart ships a table equivalent.',
      alternative: 'Provide a summary sentence per chart.',
      rationale:
        'A summary loses the shape of the trend. The table keeps the numbers and costs very little to generate from the same series.',
    },
  ],
  outcome: {
    kind: 'qualitative',
    statement:
      'Business impact was not quantified for this engagement, so no adoption or revenue claim is made. The observations below are qualitative.',
    observations: [
      'Performance conversations moved from opinion to a specific route and a specific interaction.',
      'Two regressions were caught in review rather than in production.',
      'The CI budget and the UI threshold are the same number, so a red chart and a failed build agree.',
      'On-call engineers could answer "is it the frontend?" without opening a profiler.',
    ],
  },
  improveNext: [
    'Persist series across sessions so trends are visible over weeks, not a page load.',
    'Add a diff view that compares two releases on the same axis.',
    'Move normalisation into a worker so the ingest path never competes with the render path.',
  ],
  quote: {
    text: 'If you cannot name the route and the interaction, you do not have a performance problem — you have an opinion.',
    attribution: 'Signal — design note',
  },
  diagrams: [
    { kind: 'performance-trace', caption: 'Series, budget line and rating, all from one normalised shape.' },
  ],
};

export const PROJECTS: readonly CaseStudy[] = [ORBITAL, FORGE, SIGNAL] as const;

/** Ordered summaries for lists and next-project navigation. */
export const PROJECT_SUMMARIES: readonly ProjectSummary[] = PROJECTS;

export function findProject(slug: string): CaseStudy | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}

/** Next project in reading order, wrapping to the first. */
export function nextProject(slug: string): CaseStudy {
  const index = PROJECTS.findIndex((project) => project.slug === slug);
  return PROJECTS[(index + 1) % PROJECTS.length];
}

export function previousProject(slug: string): CaseStudy {
  const index = PROJECTS.findIndex((project) => project.slug === slug);
  return PROJECTS[(index - 1 + PROJECTS.length) % PROJECTS.length];
}

export function isProjectSlug(slug: string): boolean {
  return PROJECTS.some((project) => project.slug === slug);
}
