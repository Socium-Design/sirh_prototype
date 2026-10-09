import { Component, input } from '@angular/core';
import { SocTag, type TagColor } from '@socium-design/angular-components';
import { type Profil, type StatutTableauDeBord } from '../../../tableau-de-bord/models/tableau-de-bord.model';

/** Libellés courts des pastilles (le tableau du kit ne gère pas la largeur des colonnes : GAP-DS #4). */
export const PASTILLES_PROFILS: Record<Profil, string> = { 'admin-rh': 'Admin RH', manager: 'Manager', 'direction-generale': 'Direction générale' };
export const COULEURS_PROFILS: Record<Profil, TagColor> = { 'admin-rh': 'purple', manager: 'orange', 'direction-generale': 'information' };
export const COULEURS_STATUTS: Record<StatutTableauDeBord, TagColor> = { Actif: 'success', Inactif: 'warning', Archivé: 'error' };

/** Profils d'un tableau de bord, en pastilles colorées. */
@Component({
  selector: 'app-profils',
  imports: [SocTag],
  styles: `:host { display: flex; flex-wrap: wrap; gap: var(--bridges-position-gap-xs); }`,
  template: `
    @for (profil of profils(); track profil) {
      <soc-tag [color]="couleurs[profil]">{{ libelles[profil] }}</soc-tag>
    } @empty {
      —
    }
  `,
})
export class ProfilsComponent {
  readonly profils = input.required<Profil[]>();
  protected readonly couleurs = COULEURS_PROFILS;
  protected readonly libelles = PASTILLES_PROFILS;
}

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
