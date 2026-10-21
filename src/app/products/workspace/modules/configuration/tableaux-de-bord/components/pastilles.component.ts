import { Component, input } from '@angular/core';
import { LucideCircleCheck } from '@lucide/angular';
import { SocTag, type TagColor } from '@socium-design/angular-components';
import { type StatutTableauDeBord } from '../../../tableau-de-bord/models/tableau-de-bord.model';

export const COULEURS_STATUTS: Record<StatutTableauDeBord, TagColor> = { Actif: 'success', Inactif: 'warning' };

/** Statut d'un tableau de bord (Actif / Inactif) ; « Actif » porte une coche, comme le Figma Make. */
@Component({
  selector: 'app-statut-tableau',
  imports: [SocTag, LucideCircleCheck],
  styles: `
    .statut { display: inline-flex; align-items: center; gap: var(--bridges-position-gap-2xs); }
    .statut__icone { width: var(--bridges-size-icon-xs); height: var(--bridges-size-icon-xs); }
  `,
  template: `
    <soc-tag [color]="couleurs[statut()]">
      <span class="statut">
        @if (statut() === 'Actif') {
          <svg lucideCircleCheck class="statut__icone" [strokeWidth]="2" aria-hidden="true"></svg>
        }
        {{ statut() }}
      </span>
    </soc-tag>
  `,
})
export class StatutTableauComponent {
  readonly statut = input.required<StatutTableauDeBord>();
  protected readonly couleurs = COULEURS_STATUTS;
}
