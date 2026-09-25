import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { DiagramKind } from '../../../core/data/content.types';

/**
 * TECHNICAL DIAGRAM
 * ---------------------------------------------------------------------------
 * Code-driven SVG visuals — the site's only "imagery". Each kind is a small,
 * hand-built diagram: no canvas, no chart library, no raster assets. Every
 * diagram carries a text label so it is never the sole carrier of meaning.
 */
@Component({
  selector: 'app-technical-diagram',
  standalone: true,
  templateUrl: './technical-diagram.component.html',
  styleUrl: './technical-diagram.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechnicalDiagram {
  readonly kind = input.required<DiagramKind>();
  readonly caption = input('');
  readonly label = input('');

  /** Column indices for the viewport-grid diagram. */
  protected readonly columns = Array.from({ length: 12 }, (_, index) => index);
}
