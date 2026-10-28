import { Component, computed, inject } from '@angular/core';
import { SocMessage, SocMessageContent } from '@socium-design/angular-components';
import { SocLabsNavList, SocLabsOptionRow, SocLabsOptionRowTags, type LabsNavListItem } from '../../../../../../shared/labs/labs';
import type { ProduitOption } from '../../models/option-entreprise.model';
import { OptionsOutilsComponent } from '../components/options-outils.component';
import { TagOffreComponent } from '../components/tag-offre.component';
import { MESSAGE_OPTION_PAYANTE, grouperOptions } from '../options-entreprise';
import { OptionsEntrepriseStore } from '../options-entreprise.store';

/**
 * Variante « Liste » (première version) : colonne des produits à compteurs, barre d'outils, options en lignes groupées par
 * produit (`soc-labs-option-row`), sous-options imbriquées.
 */
@Component({
  selector: 'app-options-vue-liste',
  imports: [SocMessage, SocMessageContent, SocLabsNavList, SocLabsOptionRow, SocLabsOptionRowTags, OptionsOutilsComponent, TagOffreComponent],
  styleUrl: './vue-liste.component.scss',
  template: `
    <div class="options">
      <aside class="options__produits">
        <soc-labs-nav-list ariaLabel="Produits" [items]="produitsNav()" [value]="store.produit()" (valueChange)="store.produit.set($any($event))" />
      </aside>

      <div class="options__contenu">
        <app-options-outils />
        <p class="sr-only" aria-live="polite">{{ annonce() }}</p>

        @for (groupe of groupes(); track groupe.produit) {
          <section class="options__groupe" [attr.aria-labelledby]="'groupe-' + groupe.produit" [attr.data-produit]="groupe.produit">
            <h2 class="options__titre-groupe" [id]="'groupe-' + groupe.produit">
              {{ groupe.libelle }}
              <span class="options__compteur-groupe">{{ compteurProduit(groupe.produit) }}</span>
            </h2>
            <div role="list" class="options__liste">
              @for (ligne of groupe.lignes; track ligne.option.id) {
                <soc-labs-option-row
                  [label]="ligne.option.libelle"
                  [description]="ligne.option.description"
                  [checked]="store.actives().has(ligne.option.id)"
                  (checkedChange)="store.basculer(ligne.option, $event)"
                  [isNew]="!!ligne.option.nouveau"
                  [confirmMessage]="ligne.option.offre === 'payant' ? messagePayante : undefined"
                  (labelClick)="store.ouvrirDetail(ligne.option)"
                  [attr.data-option]="ligne.option.id"
                >
                  @if (ligne.option.offre) {
                    <app-tag-offre socLabsOptionRowTags [offre]="ligne.option.offre" />
                  }
                  @for (sous of ligne.sousOptions; track sous.id) {
                    <soc-labs-option-row
                      [label]="sous.libelle"
                      [description]="sous.description"
                      [checked]="store.estActive(sous)"
                      (checkedChange)="store.basculer(sous, $event)"
                      [disabled]="!store.actives().has(ligne.option.id)"
                      [disabledReason]="'Activez d’abord « ' + ligne.option.libelle + ' ».'"
                      [isNew]="!!sous.nouveau"
                      (labelClick)="store.ouvrirDetail(sous)"
                      [attr.data-option]="sous.id"
                    />
                  }
                </soc-labs-option-row>
              }
            </div>
          </section>
        } @empty {
          @if (store.charge()) {
            <soc-message variant="inline" status="info" data-testid="vide">
              <span socMessageContent>Aucune option ne correspond à votre recherche.</span>
            </soc-message>
          }
        }
      </div>
    </div>
  `,
})
export class VueListeComponent {
  protected readonly store = inject(OptionsEntrepriseStore);
  protected readonly messagePayante = MESSAGE_OPTION_PAYANTE;

  protected readonly produitsNav = computed<LabsNavListItem[]>(() => {
    const item = (id: ProduitOption | 'tous', label: string): LabsNavListItem => {
      const { activees, total } = this.store.compteur(id);
      return { id, label, count: `${activees} / ${total}`, countLabel: `${activees} ${activees > 1 ? 'activées' : 'activée'} sur ${total}` };
    };
    return [item('tous', 'Tous les produits'), ...this.store.produits.map((p) => item(p.id, p.libelle))];
  });

  protected readonly groupes = computed(() =>
    grouperOptions(
      this.store.options(),
      this.store.produits,
      this.store.actives(),
      this.store.filtre(),
      this.store.recherche(),
      this.store.produit(),
    ),
  );

  protected readonly annonce = computed(() => {
    const n = this.groupes().reduce((t, g) => t + g.lignes.length + g.lignes.reduce((s, l) => s + l.sousOptions.length, 0), 0);
    return n ? `${n} ${n > 1 ? 'options affichées' : 'option affichée'}` : 'Aucune option ne correspond à votre recherche.';
  });

  protected compteurProduit(produit: ProduitOption): string {
    const { activees, total } = this.store.compteur(produit);
    return `${activees} / ${total} activées`;
  }
}
