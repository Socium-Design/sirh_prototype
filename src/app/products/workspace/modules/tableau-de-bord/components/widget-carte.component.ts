import { Component, computed, input, output } from '@angular/core';
import { SocMessage, SocMessageContent, SocTableFilterSelect } from '@socium-design/angular-components';
import type { ChampCondition } from '../../configuration/populations/models/population.model';
import {
  SocLabsWidgetCard,
  SocLabsWidgetCardActions,
  SocLabsWidgetCardFilters,
  SocLabsWidgetCardFooter,
  SocLabsWidgetCardIcon,
} from '../../../../../shared/labs/labs';
import type { WidgetVue } from '../services/widgets';
import { IconeGraphiqueComponent } from './icone-graphique.component';
import { WidgetGraphiqueComponent } from './widget-graphique.component';

/** Longueur maximale de la description affichée sur une carte de la consultation. */
export const LONGUEUR_DESCRIPTION = 96;

/** Description tronquée à 96 caractères (« … »). */
export function tronquer(texte: string, longueur = LONGUEUR_DESCRIPTION): string {
  return texte.length > longueur ? `${texte.slice(0, longueur).trimEnd()}…` : texte;
}

/** Valeur choisie dans la liste d'un critère de la carte. */
export interface ChoixCritere {
  champ: ChampCondition;
  valeur: string;
}

/**
 * Carte d'un widget : `soc-labs-widget-card` (Labs, GAP-DS — titre sur 2 lignes, la carte grandit avec son contenu et
 * prend la hauteur de sa ligne). Sous le titre et la description, une liste déroulante compacte du kit par critère de
 * filtre (« Site : Tous ») ; puis le graphique ou la valeur du KPI. Si une valeur choisie contredit un filtre global, la
 * carte l'indique en pied. Les actions (menu) et un pied supplémentaire (`[appWidgetPied]`) sont fournis par la page.
 * `icone` : icône du type de graphique à côté du titre (consultation) ; `tronquee` : description coupée à 96 caractères.
 */
@Component({
  selector: 'app-widget-carte',
  imports: [
    SocLabsWidgetCard, SocLabsWidgetCardIcon, SocLabsWidgetCardActions, SocLabsWidgetCardFilters, SocLabsWidgetCardFooter, SocTableFilterSelect,
    SocMessage, SocMessageContent, WidgetGraphiqueComponent, IconeGraphiqueComponent,
  ],
  styles: `
    :host { display: block; min-width: 0; height: 100%; }
    .widget__icone { display: block; width: 100%; height: 100%; }
    .widget__actions, .widget__pied { display: flex; align-items: center; gap: var(--bridges-position-gap-xs); }
    .widget__pied { flex-direction: column; align-items: stretch; width: 100%; }
    /*
     * Listes de critères : côte à côte, à la ligne quand la carte est étroite (jamais de débordement). L'enveloppe est
     * transparente pour que chaque liste soit un élément de la ligne flexible de la carte Labs.
     */
    .widget__criteres { display: contents; }
    .widget__critere { flex: 1 1 calc(var(--bridges-size-icon-lg) * 6); min-width: 0; max-width: 100%; }
  `,
  template: `
    <soc-labs-widget-card [title]="vue().titre" [description]="description()">
      @if (icone()) {
        <span socLabsWidgetCardIcon class="widget__icone">
          <app-icone-graphique [type]="vue().indicateur.typeGraphique" />
        </span>
      }
      <span socLabsWidgetCardActions class="widget__actions" (click)="$event.stopPropagation()">
        <ng-content select="[appWidgetActions]" />
      </span>
      @if (vue().criteres.length) {
        <div socLabsWidgetCardFilters class="widget__criteres">
          @for (critere of vue().criteres; track critere.champ) {
            <span class="widget__critere">
              <soc-table-filter-select
                [label]="critere.libelle"
                [options]="critere.options"
                [value]="critere.valeur"
                (valueChange)="choisir(critere.champ, $event)"
                data-testid="filtre-carte"
                [attr.data-champ]="critere.champ"
              />
            </span>
          }
        </div>
      }
      <app-widget-graphique [type]="vue().indicateur.typeGraphique" [donnees]="vue().donnees" [compact]="compact()" />
      @if (vue().filtresIgnores.length || avecPied()) {
        <div socLabsWidgetCardFooter class="widget__pied">
          @if (vue().filtresIgnores.length) {
            <soc-message variant="inline" status="info" data-testid="filtre-ignore">
              <span socMessageContent>Filtre {{ vue().filtresIgnores.join(', ') }} non appliqué : les filtres globaux l'emportent.</span>
            </soc-message>
          }
          <ng-content select="[appWidgetPied]" />
        </div>
      }
    </soc-labs-widget-card>
  `,
})
export class WidgetCarteComponent {
  readonly vue = input.required<WidgetVue>();
  /** Mini-graphe sans légende (composition). */
  readonly compact = input(false);
  /** Icône du type de graphique à côté du titre. */
  readonly icone = input(false);
  /** Description tronquée à 96 caractères au lieu de la coupe à 2 lignes. */
  readonly tronquee = input(false);
  /** Affiche le pied fourni par la page (`[appWidgetPied]`). */
  readonly avecPied = input(false);
  readonly critere = output<ChoixCritere>();

  protected readonly description = computed(() => (this.tronquee() ? tronquer(this.vue().description) : this.vue().description));

  protected choisir(champ: ChampCondition, valeur: string | undefined): void {
    if (valeur) this.critere.emit({ champ, valeur });
  }
}
