import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { findProject, nextProject } from '../../core/data/projects.data';
import { SITE } from '../../core/config/site.config';
import { CodeBlock } from '../../shared/components/code-block/code-block.component';
import { TechnicalDiagram } from '../../shared/components/technical-diagram/technical-diagram.component';

/**
 * CASE STUDY
 * ---------------------------------------------------------------------------
 * A technical magazine spread. Large margins, a sticky section index on
 * desktop, code, diagrams, margin annotations and pull quotes. Never an endless
 * stack of screenshots — there are no screenshots at all, only generated
 * visuals and text.
 */
@Component({
  selector: 'app-case-study',
  standalone: true,
  imports: [RouterLink, CodeBlock, TechnicalDiagram],
  templateUrl: './case-study.component.html',
  styleUrl: './case-study.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseStudyComponent {
  private readonly route = inject(ActivatedRoute);

  private readonly slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug') ?? '')),
    { initialValue: '' },
  );

  protected readonly project = computed(() => findProject(this.slug()));
  protected readonly next = computed(() => (this.project() ? nextProject(this.project()!.slug) : undefined));
  protected readonly site = SITE;

  /** Section index — the sticky rail on desktop. */
  protected readonly sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'problem', label: 'Problem' },
    { id: 'constraints', label: 'Constraints' },
    { id: 'system-model', label: 'System model' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'ui-decisions', label: 'UI decisions' },
    { id: 'accessibility', label: 'Accessibility' },
    { id: 'performance', label: 'Performance' },
    { id: 'implementation', label: 'Implementation' },
    { id: 'tradeoffs', label: 'Tradeoffs' },
    { id: 'outcome', label: 'Outcome' },
    { id: 'improve-next', label: 'What I’d improve next' },
  ] as const;


  protected trackBySection = (_: number, section: { id: string }): string => section.id;
}
