import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE } from '../../core/config/site.config';
interface Approach {
  readonly id: string;
  readonly index: string;
  readonly title: string;
  readonly body: string;
  readonly evidence: readonly string[];
}

const APPROACHES: readonly Approach[] = [
  {
    id: 'product-minded',
    index: '01',
    title: 'Product-minded engineering',
    body: 'I read the ticket, then I read the problem. Most frontend work that goes wrong went wrong because the interface solved a different question than the one the product was asking.',
    evidence: ['requirement translation', 'scope shaping', 'prototyping in code'],
  },
  {
    id: 'technical-leadership',
    index: '02',
    title: 'Technical leadership',
    body: 'Leading is mostly making decisions legible. I write down why a boundary exists, what it costs, and what would have to change for it to move — so the next person can disagree with me on evidence.',
    evidence: ['architecture decision records', 'review standards', 'mentoring'],
  },
  {
    id: 'design-collaboration',
    index: '03',
    title: 'Collaboration with design',
    body: 'The interaction model is a design decision and an engineering decision at the same time. I would rather be in the room while it is being shaped than review it afterwards.',
    evidence: ['state sets', 'motion specs', 'token contracts'],
  },
  {
    id: 'frontend-architecture',
    index: '04',
    title: 'Frontend architecture',
    body: 'Boundaries before features, ownership before state. If a route cannot be deleted in one commit without touching another feature, the boundary is in the wrong place.',
    evidence: ['route boundaries', 'lazy loading', 'feature-scoped state'],
  },
  {
    id: 'performance',
    index: '05',
    title: 'Performance',
    body: 'A budget nobody can check is a slogan. I put the number in configuration, assert it in the build, and let the interface read the same value.',
    evidence: ['interaction budgets', 'route payloads', 'CI assertions'],
  },
  {
    id: 'accessibility',
    index: '06',
    title: 'Accessibility',
    body: 'Keyboard parity and semantics are specified with the component, not bolted on afterwards. The checklist gets you to compliant; the state set gets you to usable.',
    evidence: ['keyboard models', 'live regions', 'contrast targets'],
  },
  {
    id: 'maintainability',
    index: '07',
    title: 'Maintainability',
    body: 'Code is read far more often than it is written. I optimise for the person who opens this file in eighteen months with no context and a deadline.',
    evidence: ['typed contracts', 'small surfaces', 'honest comments'],
  },
  {
    id: 'mentoring',
    index: '08',
    title: 'Mentoring',
    body: 'The most durable thing I can leave behind is a team that makes good decisions without me. That means explaining the reasoning, not just the answer.',
    evidence: ['paired reviews', 'written rationale', 'onboarding notes'],
  },
  {
    id: 'long-lived',
    index: '09',
    title: 'Long-lived products',
    body: 'Products that survive are the ones whose frontends stayed understandable. That is the only durability metric I have ever found worth optimising for.',
    evidence: ['migration paths', 'deprecation policy', 'documentation from types'],
  },
];

/**
 * ABOUT
 * ---------------------------------------------------------------------------
 * How the engineer thinks, not a résumé. Nine short positions, each with a
 * statement and a line of technical evidence — no employment history table, no
 * skill bars, no percentages.
 */
@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  protected readonly site = SITE;
  protected readonly approaches = APPROACHES;
}
