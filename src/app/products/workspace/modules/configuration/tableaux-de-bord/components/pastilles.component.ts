import { Component, input } from '@angular/core';
import { SocTag, type TagColor } from '@socium-design/angular-components';
import { type StatutTableauDeBord } from '../../../tableau-de-bord/models/tableau-de-bord.model';

export const COULEURS_STATUTS: Record<StatutTableauDeBord, TagColor> = { Actif: 'success', Inactif: 'warning', Archivé: 'error' };

/** Statut d'un tableau de bord (Actif / Inactif / Archivé). */
@Component({
  selector: 'app-statut-tableau',
  imports: [SocTag],
  template: `<soc-tag [color]="couleurs[statut()]">{{ statut() }}</soc-tag>`,
})
export class StatutTableauComponent {
  readonly statut = input.required<StatutTableauDeBord>();
  protected readonly couleurs = COULEURS_STATUTS;
}
