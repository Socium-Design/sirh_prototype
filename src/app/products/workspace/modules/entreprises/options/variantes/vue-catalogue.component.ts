import { Component, computed, inject, signal } from '@angular/core';
import { LucideBriefcase, LucideFileText, LucideLayoutGrid, LucideTarget, LucideWallet, LucideWorkflow } from '@lucide/angular';
import { SocButton, SocCard, SocCardActionSlot, SocCardIcon, SocMessage, SocMessageContent } from '@socium-design/angular-components';
import { SocLabsOptionRow, SocLabsOptionRowTags } from '../../../../../../shared/labs/labs';
import type { OptionEntreprise, ProduitOption } from '../../models/option-entreprise.model';
import { OptionsOutilsComponent } from '../components/options-outils.component';
import { TagOffreComponent } from '../components/tag-offre.component';
import { MESSAGE_OPTION_PAYANTE, grouperOptions, type LigneOption } from '../options-entreprise';
import { OptionsEntrepriseStore } from '../options-entreprise.store';

/** Tuiles visibles par carte avant « Tout voir » (sans recherche ni filtre). */
const TUILES_PAR_CARTE = 4;

/**
 * Variante A — Catalogue d'options (inspiration : store d'applications, « Modules & options » des Sales). Une carte du
 * kit par produit (icône, compteur, « Tout voir »), les options en tuiles (`soc-labs-option-row appearance="tile"`) ;
 * les options payantes sont mises en avant (liseré + fond teinté), les sous-options se déplient sous leur tuile. La
 * recherche et les filtres rapides filtrent les tuiles de toutes les cartes ; une carte sans résultat disparaît.
 */
@Component({
  selector: 'app-options-vue-catalogue',
  imports: [
    SocCard,
    SocCardIcon,
    SocCardActionSlot,
    SocButton,
    SocMessage,
    SocMessageContent,
    SocLabsOptionRow,
    SocLabsOptionRowTags,
    OptionsOutilsComponent,
    TagOffreComponent,
    LucideLayoutGrid,
    LucideBriefcase,
    LucideWorkflow,
    LucideTarget,
    LucideFileText,
    LucideWallet,
  ],
  styleUrl: './vue-catalogue.component.scss',
  template: `
    <app-options-outils />
    <p class="sr-only" aria-live="polite">{{ annonce() }}</p>

    <div class="catalogue">
      @for (carte of cartes(); track carte.produit) {
        <section class="catalogue__carte" [attr.aria-labelledby]="'carte-' + carte.produit" [attr.data-produit]="carte.produit">
          <h2 class="sr-only" [id]="'carte-' + carte.produit">{{ carte.libelle }}</h2>
          <soc-card [title]="carte.libelle" [subtitle]="carte.compteur">
            @switch (carte.produit) {
              @case ('workspace') {
                <svg socCardIcon lucideLayoutGrid class="size-full" [strokeWidth]="1.5" aria-hidden="true"></svg>
              }
              @case ('recrutement') {
                <svg socCardIcon lucideBriefcase class="size-full" [strokeWidth]="1.5" aria-hidden="true"></svg>
              }
              @case ('workflow') {
                <svg socCardIcon lucideWorkflow class="size-full" [strokeWidth]="1.5" aria-hidden="true"></svg>
              }
              @case ('performance') {
                <svg socCardIcon lucideTarget class="size-full" [strokeWidth]="1.5" aria-hidden="true"></svg>
              }
              @case ('doc') {
                <svg socCardIcon lucideFileText class="size-full" [strokeWidth]="1.5" aria-hidden="true"></svg>
              }
              @case ('payroll') {
                <svg socCardIcon lucideWallet class="size-full" [strokeWidth]="1.5" aria-hidden="true"></svg>
              }
            }
            <div socCardActionSlot class="catalogue__actions">
              @if (carte.masquees > 0 || deplies().has(carte.produit)) {
                <button
                  socButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  [attr.aria-expanded]="deplies().has(carte.produit)"
                  [attr.aria-controls]="'tuiles-' + carte.produit"
                  [attr.aria-label]="deplies().has(carte.produit) ? 'Réduire ' + carte.libelle : 'Tout voir : ' + carte.libelle + ', ' + carte.total + ' options'"
                  (click)="basculerCarte(carte.produit)"
                  data-testid="tout-voir"
                >
                  {{ deplies().has(carte.produit) ? 'Réduire' : 'Tout voir (' + carte.total + ')' }}
                </button>
              }
            </div>

            <div class="catalogue__tuiles" role="list" [id]="'tuiles-' + carte.produit">
              @for (ligne of carte.lignes; track ligne.option.id) {
                <soc-labs-option-row
                  appearance="tile"
                  [highlight]="ligne.option.offre === 'payant'"
                  [label]="ligne.option.libelle"
                  [description]="ligne.option.description"
                  [checked]="store.actives().has(ligne.option.id)"
                  (checkedChange)="store.basculer(ligne.option, $event)"
                  [isNew]="!!ligne.option.nouveau"
                  [confirmMessage]="ligne.option.offre === 'payant' ? messagePayante : undefined"
                  [collapsible]="true"
                  [expanded]="estDeplie(ligne)"
                  (expandedChange)="basculerSousOptions(ligne.option, $event)"
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
          </soc-card>
        </section>
      } @empty {
        @if (store.charge()) {
          <soc-message variant="inline" status="info" data-testid="vide">
            <span socMessageContent>Aucune option ne correspond à votre recherche.</span>
          </soc-message>
        }
      }
    </div>
  `,
})
export class VueCatalogueComponent {
  protected readonly store = inject(OptionsEntrepriseStore);
  protected readonly messagePayante = MESSAGE_OPTION_PAYANTE;

  /** Cartes dépliées (« Tout voir ») et tuiles dont les sous-options sont dépliées. */
  protected readonly deplies = signal<ReadonlySet<ProduitOption>>(new Set());
  private readonly sousOptionsDepliees = signal<ReadonlySet<string>>(new Set());

  private readonly filtrage = computed(() => this.store.filtre() !== 'toutes' || this.store.recherche().trim() !== '');

  protected readonly cartes = computed(() =>
    grouperOptions(this.store.options(), this.store.produits, this.store.actives(), this.store.filtre(), this.store.recherche(), 'tous').map(
      (groupe) => {
        const { activees, total } = this.store.compteur(groupe.produit);
        const limite = this.filtrage() || this.deplies().has(groupe.produit) ? groupe.lignes.length : TUILES_PAR_CARTE;
        return {
          produit: groupe.produit,
          libelle: groupe.libelle,
          compteur: `${activees} / ${total} activées`,
          total: groupe.lignes.length,
          lignes: groupe.lignes.slice(0, limite),
          masquees: Math.max(0, groupe.lignes.length - limite),
        };
      },
    ),
  );

  protected readonly annonce = computed(() => {
    const n = this.cartes().reduce((t, c) => t + c.lignes.length, 0);
    return n ? `${n} ${n > 1 ? 'options affichées' : 'option affichée'}` : 'Aucune option ne correspond à votre recherche.';
  });

  /** Sous-options dépliées à la demande, ou d'office quand la recherche en trouve une. */
  protected estDeplie(ligne: LigneOption): boolean {
    if (this.sousOptionsDepliees().has(ligne.option.id)) return true;
    const q = this.store.recherche().trim();
    return !!q && ligne.sousOptions.some((s) => this.store.correspond(s, 'toutes'));
  }

  protected basculerSousOptions(option: OptionEntreprise, deplie: boolean): void {
    this.sousOptionsDepliees.update((s) => {
      const suivant = new Set(s);
      if (deplie) suivant.add(option.id);
      else suivant.delete(option.id);
      return suivant;
    });
  }

  protected basculerCarte(produit: ProduitOption): void {
    this.deplies.update((s) => {
      const suivant = new Set(s);
      if (suivant.has(produit)) suivant.delete(produit);
      else suivant.add(produit);
      return suivant;
    });
  }
}
