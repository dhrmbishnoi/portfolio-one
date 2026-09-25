/**
 * SYSTEMS DATA
 * ---------------------------------------------------------------------------
 * Content for the "Systems I Care About" editorial section on the home page and
 * for the /systems engineering manual. The manual is deliberately written as
 * reference material — it is a page about craft, not a services list.
 */

export type SystemInteraction = 'evidence-reveal' | 'number-settle' | 'rule-extend' | 'token-highlight';

export interface SystemEntry {
  readonly id: string;
  readonly index: string;
  readonly title: string;
  readonly statement: string;
  readonly evidence: readonly string[];
  readonly interaction: SystemInteraction;
  /** One-line technical footnote rendered in mono. */
  readonly footnote: string;
}

export const SYSTEM_ENTRIES: readonly SystemEntry[] = [
  {
    id: 'architecture',
    index: '01',
    title: 'Architecture',
    statement: 'Systems that remain understandable as complexity grows.',
    evidence: [
      'Angular architecture',
      'Signals / RxJS',
      'route boundaries',
      'state ownership',
      'lazy loading',
    ],
    interaction: 'evidence-reveal',
    footnote: 'boundaries before features · ownership before state',
  },
  {
    id: 'interface-systems',
    index: '02',
    title: 'Interface Systems',
    statement: 'Components with a contract, not a pile of variants.',
    evidence: [
      'component API design',
      'token layering',
      'interaction state sets',
      'theme instances',
      'documentation from types',
    ],
    interaction: 'token-highlight',
    footnote: 'the component owns the behaviour · the consumer owns the content',
  },
  {
    id: 'performance',
    index: '03',
    title: 'Performance',
    statement: 'A budget is a design constraint you can actually defend.',
    evidence: [
      'interaction budgets',
      'route-level payloads',
      'virtualisation',
      'change detection strategy',
      'CI assertions',
    ],
    interaction: 'rule-extend',
    footnote: 'measured in CI · not measured by hand',
  },
  {
    id: 'product-quality',
    index: '04',
    title: 'Product Quality',
    statement: 'Accessibility and maintainability are features, not phases.',
    evidence: [
      'keyboard parity',
      'screen-reader semantics',
      'contrast targets',
      'testing philosophy',
      'migration paths',
    ],
    interaction: 'number-settle',
    footnote: 'shipped with the feature · never retrofitted',
  },
] as const;

// ---------------------------------------------------------------------------
// /systems — engineering manual
// ---------------------------------------------------------------------------

export interface ManualSection {
  readonly id: string;
  readonly label: string;
  readonly title: string;
  readonly lede: string;
  readonly body: readonly string[];
  readonly bullets?: readonly string[];
  readonly code?: {
    readonly filename: string;
    readonly language: 'typescript' | 'scss' | 'bash' | 'html' | 'json';
    readonly code: string;
  };
  readonly diagram?: 'architecture-map' | 'token-graph' | 'state-flow' | 'dependency-graph' | 'performance-trace' | 'viewport-grid';
  readonly caption?: string;
}

export const MANUAL_SECTIONS: readonly ManualSection[] = [
  {
    id: 'architecture-map',
    label: '01',
    title: 'Angular architecture map',
    lede: 'The shape of an application is decided by its boundaries, not its folder names.',
    body: [
      'Every route is a boundary with an owner. A feature may depend on core and shared; it may never depend on another feature. The rule is enforced by an import lint check rather than by review, because review does not scale and lint does.',
      'Feature state is provided at the route level. Unmounting a route disposes its state and its subscriptions, which removes an entire category of "why is this still updating" bugs.',
    ],
    bullets: [
      'core — config, data, cross-cutting services, no feature knowledge',
      'shared — presentational primitives, no domain knowledge',
      'features — one folder per route, owns its own state',
      'lazy loading — every route is a separate chunk by default',
    ],
    diagram: 'architecture-map',
    caption: 'Dependency direction is one-way; features never reach sideways.',
  },
  {
    id: 'token-model',
    label: '02',
    title: 'Design token model',
    lede: 'Three layers, one public surface. A rebrand should never open a product repository.',
    body: [
      'Primitives are raw scales and are private. Semantic aliases name intent and are the only layer product code may import. Component tokens are owned by a component and are the sanctioned override point for a theme.',
      'Because tokens compile to CSS custom properties, switching a theme is a cascade rather than a rebuild. Nothing is calculated at runtime and nothing is re-rendered on switch.',
    ],
    code: {
      filename: 'token-layers.scss',
      language: 'scss',
      code: `// 1 · primitives — private
$gray-900: #141414;
$lime-400: #d9ff57;

// 2 · semantic aliases — public API
:root {
  --fg-default: #{$gray-900};
  --accent-interactive: #{$lime-400};
}

// 3 · component tokens — override point
forge-button {
  --button-focus-ring: var(--accent-interactive);
  --button-gap: 0.5rem;
}`,
    },
    diagram: 'token-graph',
    caption: 'The import rule is what makes the model survive a rebrand.',
  },
  {
    id: 'state-ownership',
    label: '03',
    title: 'State ownership patterns',
    lede: 'Decide who owns a piece of state before deciding how to store it.',
    body: [
      'View state belongs in signals: it is synchronous, local and derived. Server state belongs in a normalised store fed by intents, because it is shared, concurrent and replayed. URL state belongs in the router. Mixing the three is how applications become unpredictable.',
      'The test is simple. If unmounting the route should destroy it, it is feature state. If two clients can change it at once, it belongs in the store.',
    ],
    code: {
      filename: 'ownership.ts',
      language: 'typescript',
      code: `// View state — synchronous, local, disposable.
readonly density = signal<Density>('comfortable');
readonly rowHeight = computed(() => DENSITY[this.density()]);

// Server state — shared, concurrent, replayed.
readonly plans = this.planStore.plans;

// URL state — shareable, restorable, owned by the router.
readonly filter = toSignal(
  this.route.queryParamMap.pipe(map((p) => p.get('status'))),
);`,
    },
    diagram: 'state-flow',
    caption: 'Intents in, derived state out, view state alongside.',
  },
  {
    id: 'accessibility-states',
    label: '04',
    title: 'Accessibility states',
    lede: 'Accessibility is a set of specified states, not a checklist at the end.',
    body: [
      'Every interactive component ships its full state set: default, hover, focus, active, disabled, loading and error. Focus is never removed. Disabled is reserved for actions that are genuinely unavailable; otherwise the control stays enabled and explains itself.',
      'Colour never carries meaning alone. A status is a colour plus a glyph plus a label, which is also why the system survives a colour-blind reviewer and a monochrome print.',
    ],
    bullets: [
      'Focus: 2px accent ring, 3px offset, on every control, always',
      'Names: icon-only controls derive their name inside the component',
      'Announcements: state changes go through a component-owned live region',
      'Targets: 44px minimum hit area, independent of visual size',
      'Motion: reduced-motion handled in the component, not the consumer',
    ],
    diagram: 'state-flow',
    caption: 'States are a set; a new component inherits the whole set.',
  },
  {
    id: 'performance-budget',
    label: '05',
    title: 'Performance budget model',
    lede: 'A budget that lives only in a document is a wish. Put it in CI.',
    body: [
      'Budgets are configuration read by both the CI assertion and the UI threshold, so a red chart and a failed build always agree. Route-level payloads and interaction latency are the two numbers that matter most; both are asserted, neither is measured by hand.',
      'Budgets are per route, not per application, because a route that is never visited should not pay for the one that is.',
    ],
    code: {
      filename: 'budgets.ts',
      language: 'typescript',
      code: `export const BUDGETS = {
  '/': { lcp: 1800, inp: 200, transfer: 120_000 },
  '/work': { lcp: 1800, inp: 200, transfer: 110_000 },
  '/work/orbital': { lcp: 2000, inp: 200, transfer: 140_000 },
  '/systems': { lcp: 1800, inp: 200, transfer: 110_000 },
} as const satisfies Record<string, Budget>;`,
    },
    diagram: 'performance-trace',
    caption: 'The same threshold drives the assertion and the chart.',
  },
  {
    id: 'component-api',
    label: '06',
    title: 'Component API examples',
    lede: 'A good API makes the wrong usage harder to type than the right one.',
    body: [
      'Signal inputs make required props required and optional props optional at the type level. A component that needs an accessible name asks for one; a component that can generate one does not.',
      'The public surface is the types. Documentation is generated from the same declarations the build consumes, so a prop cannot exist in code and be missing from the docs.',
    ],
    code: {
      filename: 'timeline-lane.component.ts',
      language: 'typescript',
      code: `@Component({
  selector: 'app-timeline-lane',
  standalone: true,
  host: { role: 'row', '[attr.aria-rowindex]': 'rowIndex()' },
  template: \`<ng-content />\`,
})
export class TimelineLane {
  /** Stable position in the grid, independent of virtualisation. */
  readonly rowIndex = input.required<number>();
  /** Selected state is owned by the grid, not the row. */
  readonly selected = input(false);
  /** Density is a token, so the row never hard-codes a height. */
  readonly density = input<Density>('comfortable');
}`,
    },
  },
  {
    id: 'testing-philosophy',
    label: '07',
    title: 'Testing philosophy',
    lede: 'Test the contract, not the implementation. A test that mirrors the code tests nothing.',
    body: [
      'Route resolution, slug handling and invalid input are tested at the boundary, because that is where content mistakes become user-visible errors. Interaction behaviour is tested through the host element a user would actually touch.',
      'Visual regressions are caught by screenshot review at fixed viewports rather than by a brittle DOM snapshot. Accessibility is verified by keyboard walkthrough and by the states the component declares, not by an automated score.',
    ],
    bullets: [
      'Routing: every route resolves, every invalid slug lands somewhere useful',
      'Content: data modules resolve by slug and report missing content loudly',
      'Interaction: keyboard paths, focus movement, copy feedback, menu behaviour',
      'Motion: reduced-motion renders the final state without animation',
      'No snapshot tests of template structure — they fail for the wrong reasons',
    ],
    code: {
      filename: 'terminal',
      language: 'bash',
      code: `npm run typecheck   # strict templates + strict TS
npm run test         # routing, slugs, a11y paths, interactions
npm run build        # production budgets asserted by the build`,
    },
  },
] as const;
