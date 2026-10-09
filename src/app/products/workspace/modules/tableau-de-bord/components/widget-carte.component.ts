import { Component, input } from '@angular/core';
import { SocCard, SocCardActionSlot, SocTag } from '@socium-design/angular-components';
import type { WidgetVue } from '../services/widgets';
import { WidgetGraphiqueComponent } from './widget-graphique.component';

/**
 * Carte d'un widget : `soc-card` du kit (titre, description tronquée sur une ligne par le kit), vrai graphique et filtres
 * du widget rattachés à la carte. Les actions (menu kebab, œil…) sont fournies par la page via `[appWidgetActions]`.
 */
@Component({
  selector: 'app-widget-carte',
  imports: [SocCard, SocCardActionSlot, SocTag, WidgetGraphiqueComponent],
  styles: `
    :host { display: block; min-width: 0; }
    .widget { display: flex; flex-direction: column; gap: var(--bridges-position-gap-md); width: 100%; }
    .widget__filtres, .widget__actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--bridges-position-gap-xs); }
  `,
  template: `
    <soc-card [title]="vue().titre" [subtitle]="vue().description" [attr.title]="vue().description">
      <span socCardActionSlot class="widget__actions" (click)="$event.stopPropagation()">
        <ng-content select="[appWidgetActions]" />
      </span>
      <div class="widget">
        <app-widget-graphique [type]="vue().indicateur.typeGraphique" [donnees]="vue().donnees" />
        @if (vue().filtres.length) {
          <div class="widget__filtres" data-testid="filtres">
            @for (filtre of vue().filtres; track filtre.valeur) {
              <soc-tag color="information">{{ filtre.libelle }}</soc-tag>
            }
          </div>
        }
      </div>
    </soc-card>
  `,
})
export class WidgetCarteComponent {
  readonly vue = input.required<WidgetVue>();
}
