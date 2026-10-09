import { Component, computed, input } from '@angular/core';
import { SocCard, SocCardActionSlot, SocCardFooter, SocCardIcon } from '@socium-design/angular-components';
import { SocLabsChartTypeChip } from '../../../../../shared/labs/labs';
import type { WidgetVue } from '../services/widgets';
import { IconeGraphiqueComponent } from './icone-graphique.component';
import { WidgetGraphiqueComponent } from './widget-graphique.component';

/** Longueur maximale de la description affichée sur une carte. */
export const LONGUEUR_DESCRIPTION = 96;

/** Description tronquée à 96 caractères (« … »). */
export function tronquer(texte: string, longueur = LONGUEUR_DESCRIPTION): string {
  return texte.length > longueur ? `${texte.slice(0, longueur).trimEnd()}…` : texte;
}

/**
 * Carte d'un widget : `soc-card` du kit avec l'icône du type de graphique, le titre, la description (96 caractères), le
 * graphique (mini-graphe en composition) et un pied fourni par la page (`[appWidgetPied]` : filtres, avertissement…).
 * Les actions (menu) sont fournies par la page via `[appWidgetActions]`. `pastille` : type en `soc-labs-chart-type-chip` (Labs).
 */
@Component({
  selector: 'app-widget-carte',
  imports: [SocCard, SocCardIcon, SocCardActionSlot, SocCardFooter, SocLabsChartTypeChip, WidgetGraphiqueComponent, IconeGraphiqueComponent],
  styles: `
    :host { display: block; min-width: 0; }
    .widget__icone { display: block; width: 100%; height: 100%; }
    .widget__actions, .widget__pied { display: flex; flex-wrap: wrap; align-items: center; gap: var(--bridges-position-gap-xs); }
    /* Description entière coupée à 2 lignes (le sous-titre de soc-card est limité à 1 ligne). */
    .widget__description {
      display: -webkit-box;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      font-family: var(--index-conteneur-card-subtitle-font);
      font-size: var(--index-conteneur-card-subtitle-size);
      font-weight: var(--index-conteneur-card-subtitle-weight);
      color: var(--index-conteneur-card-subtitle-color);
    }
  `,
  template: `
    <soc-card [title]="vue().titre" [subtitle]="descriptionDeuxLignes() ? undefined : description()" [attr.title]="vue().titre + ' — ' + vue().description">
      <span socCardIcon class="widget__icone">
        @if (pastille()) {
          <soc-labs-chart-type-chip [type]="vue().indicateur.typeGraphique" />
        } @else {
          <app-icone-graphique [type]="vue().indicateur.typeGraphique" />
        }
      </span>
      <span socCardActionSlot class="widget__actions" (click)="$event.stopPropagation()">
        <ng-content select="[appWidgetActions]" />
      </span>
      @if (descriptionDeuxLignes()) {
        <p class="widget__description" data-testid="description">{{ vue().description }}</p>
      }
      <app-widget-graphique [type]="vue().indicateur.typeGraphique" [donnees]="vue().donnees" [compact]="compact()" />
      @if (avecPied()) {
        <div socCardFooter class="widget__pied">
          <ng-content select="[appWidgetPied]" />
        </div>
      }
    </soc-card>
  `,
})
export class WidgetCarteComponent {
  readonly vue = input.required<WidgetVue>();
  readonly compact = input(false);
  /** Type de graphique en pastille colorée (Labs, composition) plutôt qu'en icône seule. */
  readonly pastille = input(false);
  /** Description entière, coupée à 2 lignes en CSS (composition), au lieu du sous-titre tronqué à 96 caractères. */
  readonly descriptionDeuxLignes = input(false);
  /** Affiche le pied de carte (contenu `[appWidgetPied]`). */
  readonly avecPied = input(true);
  protected readonly description = computed(() => tronquer(this.vue().description));
}
