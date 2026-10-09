import { Component, computed, input } from '@angular/core';
import { SocCard, SocCardActionSlot, SocCardFooter, SocCardIcon } from '@socium-design/angular-components';
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
 * Les actions (menu) sont fournies par la page via `[appWidgetActions]`.
 */
@Component({
  selector: 'app-widget-carte',
  imports: [SocCard, SocCardIcon, SocCardActionSlot, SocCardFooter, WidgetGraphiqueComponent, IconeGraphiqueComponent],
  styles: `
    :host { display: block; min-width: 0; }
    .widget__icone { display: block; width: 100%; height: 100%; }
    .widget__actions, .widget__pied { display: flex; flex-wrap: wrap; align-items: center; gap: var(--bridges-position-gap-xs); }
  `,
  template: `
    <soc-card [title]="vue().titre" [subtitle]="description()" [attr.title]="vue().titre + ' — ' + vue().description">
      <span socCardIcon class="widget__icone"><app-icone-graphique [type]="vue().indicateur.typeGraphique" /></span>
      <span socCardActionSlot class="widget__actions" (click)="$event.stopPropagation()">
        <ng-content select="[appWidgetActions]" />
      </span>
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
  /** Affiche le pied de carte (contenu `[appWidgetPied]`). */
  readonly avecPied = input(true);
  protected readonly description = computed(() => tronquer(this.vue().description));
}
