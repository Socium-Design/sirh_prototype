import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  type AppIconName,
  SocAppIconGlyph,
  SocBreadcrumb,
  SocDrawer,
  SocDrawerDetailItem,
  SocMessage,
  SocMessageContent,
  SocPageBreadcrumb,
  SocPageDetails,
} from '@socium-design/angular-components';
import {
  SocLabsChangesBar,
  SocLabsNavList,
  SocLabsOptionRow,
  SocLabsOptionRowTags,
  type LabsNavListItem,
} from '../../../../../shared/labs/labs';
import type { OptionEntreprise, ProduitOption } from '../models/option-entreprise.model';
import { BadgeNouveauComponent } from './components/badge-nouveau.component';
import { OptionsOutilsComponent } from './components/options-outils.component';
import { TagOffreComponent } from './components/tag-offre.component';
import { EXPLICATION_NOUVEAUTES, MESSAGE_OPTION_PAYANTE, dateLongue, grouperOptions } from './options-entreprise';
import { OptionsEntrepriseStore } from './options-entreprise.store';

const dateFr = (iso: string) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '—');

/**
 * Workspace > Entreprises > {entreprise} > Fonctionnalités et options — remplace la page des « feature flags ».
 * Colonne gauche : produits (compteur activées / total). Barre d'outils : recherche (début des mots du libellé et de la
 * description) et filtres rapides. Liste groupée par produit (`soc-labs-option-row`), sous-options imbriquées et
 * désactivées tant que le parent est coupé. Une option payante s'active après une confirmation dans la ligne. Les
 * changements s'appliquent à l'enregistrement (`soc-labs-changes-bar`). Clic sur un libellé : détail dans un `soc-drawer`.
 * L'état (options, brouillon, filtres, enregistrement, détail) est dans `OptionsEntrepriseStore`.
 */
@Component({
  selector: 'app-options-entreprise-page',
  imports: [
    SocPageDetails,
    SocPageBreadcrumb,
    SocAppIconGlyph,
    SocBreadcrumb,
    SocMessage,
    SocMessageContent,
    SocDrawer,
    SocDrawerDetailItem,
    SocLabsNavList,
    SocLabsOptionRow,
    SocLabsOptionRowTags,
    SocLabsChangesBar,
    OptionsOutilsComponent,
    TagOffreComponent,
    BadgeNouveauComponent,
  ],
  providers: [OptionsEntrepriseStore],
  styleUrl: './options-entreprise-page.component.scss',
  template: `
    <soc-page-details title="Fonctionnalités et options" [topStatusLabel]="store.entreprise()?.nom ?? ''" [description]="store.charge() ? store.resume() : ''">
      <soc-breadcrumb socPageBreadcrumb [items]="breadcrumb()" />

      <div class="options">
        <aside class="options__produits">
          <soc-labs-nav-list ariaLabel="Produits" [items]="produitsNav()" [value]="store.produit()" (valueChange)="store.produit.set($any($event))" />
        </aside>

        <div class="options__contenu">
          <app-options-outils />
          <p class="options__modification" data-testid="derniere-modification">
            Dernière modification par {{ store.derniereModification().par }} le {{ dateFr(store.derniereModification().le) }}
          </p>
          @if (store.filtre() === 'nouveautes') {
            <p class="options__explication" data-testid="explication-filtre">{{ explicationNouveautes }}</p>
          }
          <p class="sr-only" aria-live="polite">{{ annonce() }}</p>

          @for (groupe of groupes(); track groupe.produit) {
            <section class="options__groupe" [attr.aria-labelledby]="'groupe-' + groupe.produit" [attr.data-produit]="groupe.produit">
              <h2 class="options__titre-groupe" [id]="'groupe-' + groupe.produit">
                <span class="options__nom-groupe">
                  <soc-app-icon-glyph class="options__icone-groupe" [name]="groupe.icone" aria-hidden="true" />
                  {{ groupe.libelle }}
                </span>
                <span class="options__compteur-groupe">{{ compteurProduit(groupe.produit) }}</span>
              </h2>
              <div role="list" class="options__liste">
                @for (ligne of groupe.lignes; track ligne.option.id) {
                  <soc-labs-option-row
                    [label]="ligne.option.libelle"
                    [description]="ligne.option.description"
                    [checked]="store.actives().has(ligne.option.id)"
                    (checkedChange)="store.basculer(ligne.option, $event)"
                    [confirmMessage]="ligne.option.offre === 'payant' ? messagePayante : undefined"
                    (labelClick)="store.ouvrirDetail(ligne.option)"
                    [attr.data-option]="ligne.option.id"
                  >
                    @if (ligne.option.nouveau) {
                      <app-badge-nouveau socLabsOptionRowTags [date]="ligne.option.miseEnLigne" />
                    }
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
                        (labelClick)="store.ouvrirDetail(sous)"
                        [attr.data-option]="sous.id"
                      >
                        @if (sous.nouveau) {
                          <app-badge-nouveau socLabsOptionRowTags [date]="sous.miseEnLigne" />
                        }
                      </soc-labs-option-row>
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

      <soc-labs-changes-bar
        [count]="store.nbModifications()"
        [saved]="store.enregistre()"
        [saving]="store.enregistrement()"
        (save)="store.enregistrer()"
        (cancel)="store.annuler()"
      />
    </soc-page-details>

    @if (store.detail(); as d) {
      <soc-drawer [open]="true" [title]="d.libelle" [topline]="store.libelleProduit(d.produit)" (close)="store.fermerDetail()">
        <soc-drawer-detail-item label="Description" [value]="d.description" />
        <soc-drawer-detail-item label="Offre" [value]="store.libelleOffre(d)" />
        <soc-drawer-detail-item label="Produit" [value]="store.libelleProduit(d.produit)" />
        <soc-drawer-detail-item label="État" [value]="store.estActive(d) ? 'Activée' : 'Désactivée'" />
        @if (d.parentId) {
          <soc-drawer-detail-item label="Option parente" [value]="store.libelleOption(d.parentId)" />
        }
        @if (sousOptionsDe(d)) {
          <soc-drawer-detail-item label="Sous-options" [value]="sousOptionsDe(d)" />
        }
        @if (d.miseEnLigne) {
          <soc-drawer-detail-item label="Ajoutée le" [value]="dateLongue(d.miseEnLigne)" data-testid="date-ajout" />
        }
      </soc-drawer>
    }
  `,
})
export class OptionsEntreprisePageComponent {
  protected readonly store = inject(OptionsEntrepriseStore);
  private readonly router = inject(Router);

  protected readonly messagePayante = MESSAGE_OPTION_PAYANTE;
  protected readonly dateFr = dateFr;
  protected readonly dateLongue = dateLongue;
  protected readonly explicationNouveautes = EXPLICATION_NOUVEAUTES;

  protected readonly breadcrumb = computed(() => [
    { label: 'Entreprises', onClick: () => this.router.navigateByUrl('/workspace/entreprises') },
    { label: this.store.entreprise()?.nom ?? '…' },
    { label: 'Fonctionnalités et options' },
  ]);

  protected readonly produitsNav = computed<LabsNavListItem[]>(() => {
    const item = (id: ProduitOption | 'tous', label: string, icon?: AppIconName): LabsNavListItem => {
      const { activees, total } = this.store.compteur(id);
      return { id, label, icon, count: `${activees} / ${total}`, countLabel: `${activees} ${activees > 1 ? 'activées' : 'activée'} sur ${total}` };
    };
    return [item('tous', 'Tous les produits'), ...this.store.produits.map((p) => item(p.id, p.libelle, p.icone))];
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

  protected sousOptionsDe(option: OptionEntreprise): string {
    return this.store
      .sousOptions(option)
      .map((o) => `${o.libelle} (${this.store.estActive(o) ? 'activée' : 'désactivée'})`)
      .join(', ');
  }
}
