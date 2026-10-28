import { Component, inject } from '@angular/core';
import { SocSearchBar, SocSelectableChips } from '@socium-design/angular-components';
import { FILTRES_OPTIONS } from '../options-entreprise';
import { OptionsEntrepriseStore } from '../options-entreprise.store';

/** Barre d'outils : recherche (début des mots du libellé et de la description) et filtres rapides. */
@Component({
  selector: 'app-options-outils',
  imports: [SocSearchBar, SocSelectableChips],
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--bridges-position-gap-md);
    }

    .recherche {
      flex: 1 1 280px;
      max-width: 420px;
    }

    .filtres {
      display: flex;
      flex-wrap: wrap;
      gap: var(--bridges-position-gap-sm);
    }
  `,
  template: `
    <soc-search-bar
      class="recherche"
      placeholder="Rechercher une option (libellé ou description)"
      [value]="store.recherche()"
      (valueChange)="store.recherche.set($event)"
      data-testid="recherche"
    />
    <div class="filtres" role="group" aria-label="Filtrer les options" data-testid="filtres">
      @for (f of liste; track f.id) {
        <soc-selectable-chips [label]="f.libelle" [selected]="store.filtre() === f.id" (click)="store.filtre.set(f.id)" />
      }
    </div>
  `,
})
export class OptionsOutilsComponent {
  protected readonly store = inject(OptionsEntrepriseStore);
  protected readonly liste = FILTRES_OPTIONS;
}
