import { Component, computed, inject, signal } from '@angular/core';
import { SocAccordion, SocAccordionRightSlot, SocMessage, SocMessageContent, SocTag } from '@socium-design/angular-components';
import { SocLabsActionChip, SocLabsOptionRow, SocLabsOptionRowTags } from '../../../../../../shared/labs/labs';
import type { ModuleEntreprise } from '../../models/entreprise.model';
import type { OptionEntreprise, ProduitOption } from '../../models/option-entreprise.model';
import { EntreprisesService } from '../../services/entreprises.service';
import { OptionsOutilsComponent } from '../components/options-outils.component';
import { TagOffreComponent } from '../components/tag-offre.component';
import { MESSAGE_OPTION_PAYANTE } from '../options-entreprise';
import { OptionsEntrepriseStore } from '../options-entreprise.store';

/**
 * Variante B — L'offre du client d'abord (inspiration : page de facturation). En tête, « Offre de {entreprise} » : modules
 * souscrits, options payantes activées (puces « Désactiver ») et réglage de leurs sous-options. Puis les options payantes
 * disponibles (« Activer » → confirmation dans la ligne), les options standard par produit (blocs repliables, le premier
 * ouvert) et les customisations client. La recherche filtre les trois sections.
 */
@Component({
  selector: 'app-options-vue-offre',
  imports: [
    SocAccordion,
    SocAccordionRightSlot,
    SocMessage,
    SocMessageContent,
    SocLabsActionChip,
    SocLabsOptionRow,
    SocLabsOptionRowTags,
    SocTag,
    OptionsOutilsComponent,
    TagOffreComponent,
  ],
  styleUrl: './vue-offre.component.scss',
  template: `
    <section class="offre" aria-labelledby="offre-titre" data-testid="offre">
      <h2 class="offre__titre" id="offre-titre">Offre de {{ store.entreprise()?.nom }}</h2>

      <div class="offre__grille">
        <div class="offre__bloc">
          <h3 class="offre__sous-titre">Modules souscrits</h3>
          <ul class="offre__modules" data-testid="modules">
            @for (module of modules(); track module) {
              <li>
                <soc-tag color="information"><span aria-hidden="true">{{ module }}</span></soc-tag>
                <span>{{ libelleModule(module) }}</span>
              </li>
            }
          </ul>
        </div>

        <div class="offre__bloc">
          <h3 class="offre__sous-titre">Options payantes activées</h3>
          <p class="offre__chiffre" data-testid="nb-payantes">
            {{ payantesActives().length }}
            <span class="offre__chiffre-libelle">sur {{ payantes().length }} options payantes</span>
          </p>
          @if (payantesActives().length) {
            <ul class="offre__puces" data-testid="puces">
              @for (option of payantesActives(); track option.id) {
                <li>
                  <soc-labs-action-chip [label]="option.libelle" (action)="desactiver(option)" [attr.data-option]="option.id" />
                </li>
              }
            </ul>
          } @else {
            <p class="offre__vide">Aucune option payante activée.</p>
          }
        </div>
      </div>

      @if (parentsActifs().length) {
        <div class="offre__sous-options">
          <h3 class="offre__sous-titre">Étapes des options activées</h3>
          @for (parent of parentsActifs(); track parent.id) {
            <soc-accordion [label]="parent.libelle" [attr.data-parent]="parent.id">
              <span socAccordionRightSlot class="section__compteur">{{ compteurSousOptions(parent) }}</span>
              <div role="list" class="section__liste">
                @for (sous of store.sousOptions(parent); track sous.id) {
                  <soc-labs-option-row
                    [label]="sous.libelle"
                    [description]="sous.description"
                    [checked]="store.estActive(sous)"
                    (checkedChange)="store.basculer(sous, $event)"
                    [isNew]="!!sous.nouveau"
                    (labelClick)="store.ouvrirDetail(sous)"
                    [attr.data-option]="sous.id"
                  />
                }
              </div>
            </soc-accordion>
          }
        </div>
      }
    </section>

    <app-options-outils [filtres]="false" placeholder="Rechercher une option" />
    <p class="sr-only" aria-live="polite">{{ annonce() }}</p>

    @if (payantesDisponibles().length) {
      <section class="section" aria-labelledby="section-payantes" data-testid="section-payantes">
        <h2 class="section__titre" id="section-payantes">
          Options payantes disponibles <span class="section__compteur">{{ payantesDisponibles().length }}</span>
        </h2>
        <p class="section__intro">À activer seulement si l'option a été vendue au client.</p>
        <div role="list" class="section__liste">
          @for (option of payantesDisponibles(); track option.id) {
            <soc-labs-option-row
              control="button"
              [highlight]="true"
              [label]="option.libelle"
              [description]="option.description"
              [checked]="store.actives().has(option.id)"
              (checkedChange)="activer(option, $event)"
              [isNew]="!!option.nouveau"
              [confirmMessage]="messagePayante"
              (labelClick)="store.ouvrirDetail(option)"
              [attr.data-option]="option.id"
            >
              <app-tag-offre socLabsOptionRowTags offre="payant" />
            </soc-labs-option-row>
          }
        </div>
      </section>
    }

    @if (groupesStandard().length) {
      <section class="section" aria-labelledby="section-standard" data-testid="section-standard">
        <h2 class="section__titre" id="section-standard">Options standard</h2>
        <p class="section__intro">Incluses dans l'abonnement : elles s'activent directement.</p>
        @for (groupe of groupesStandard(); track groupe.produit; let premier = $first) {
          <soc-accordion
            [label]="groupe.libelle"
            [open]="estOuvert(groupe.produit, premier)"
            (openChange)="basculerGroupe(groupe.produit, $event)"
            [attr.data-produit]="groupe.produit"
          >
            <span socAccordionRightSlot class="section__compteur">{{ groupe.compteur }}</span>
            <div role="list" class="section__liste">
              @for (option of groupe.options; track option.id) {
                <soc-labs-option-row
                  [label]="option.libelle"
                  [description]="option.description"
                  [checked]="store.actives().has(option.id)"
                  (checkedChange)="store.basculer(option, $event)"
                  [isNew]="!!option.nouveau"
                  (labelClick)="store.ouvrirDetail(option)"
                  [attr.data-option]="option.id"
                >
                  <app-tag-offre socLabsOptionRowTags offre="standard" />
                </soc-labs-option-row>
              }
            </div>
          </soc-accordion>
        }
      </section>
    }

    @if (customisations().length) {
      <section class="section section--customisations" aria-labelledby="section-customisations" data-testid="section-customisations">
        <h2 class="section__titre" id="section-customisations">Customisations client</h2>
        <p class="section__intro">Réglages propres à un client, à activer uniquement sur demande.</p>
        <div role="list" class="section__liste">
          @for (option of customisations(); track option.id) {
            <soc-labs-option-row
              [label]="option.libelle + ' (' + store.libelleProduit(option.produit) + ')'"
              [description]="option.description"
              [checked]="store.actives().has(option.id)"
              (checkedChange)="store.basculer(option, $event)"
              [isNew]="!!option.nouveau"
              (labelClick)="store.ouvrirDetail(option)"
              [attr.data-option]="option.id"
            >
              <app-tag-offre socLabsOptionRowTags offre="customisation" />
            </soc-labs-option-row>
          }
        </div>
      </section>
    }

    @if (store.charge() && !payantesDisponibles().length && !groupesStandard().length && !customisations().length) {
      <soc-message variant="inline" status="info" data-testid="vide">
        <span socMessageContent>Aucune option ne correspond à votre recherche.</span>
      </soc-message>
    }
  `,
})
export class VueOffreComponent {
  protected readonly store = inject(OptionsEntrepriseStore);
  private readonly service = inject(EntreprisesService);
  protected readonly messagePayante = MESSAGE_OPTION_PAYANTE;

  /** Blocs « Options standard » ouverts ou fermés par l'utilisateur (sinon : le premier ouvert). */
  private readonly ouverts = signal<ReadonlyMap<ProduitOption, boolean>>(new Map());

  private readonly premierNiveau = computed(() => this.store.options().filter((o) => !o.parentId));
  protected readonly modules = computed<ModuleEntreprise[]>(() => this.store.entreprise()?.modules ?? []);
  protected readonly payantes = computed(() => this.premierNiveau().filter((o) => o.offre === 'payant'));
  protected readonly payantesActives = computed(() => this.payantes().filter((o) => this.store.actives().has(o.id)));
  protected readonly parentsActifs = computed(() => this.payantesActives().filter((o) => this.store.sousOptions(o).length > 0));

  private readonly correspond = (o: OptionEntreprise) => this.store.correspond(o, 'toutes');

  protected readonly payantesDisponibles = computed(() =>
    this.payantes().filter((o) => !this.store.actives().has(o.id) && this.correspond(o)),
  );

  protected readonly groupesStandard = computed(() =>
    this.store.produits
      .map((p) => {
        const options = this.premierNiveau().filter((o) => o.produit === p.id && o.offre === 'standard');
        const visibles = options.filter(this.correspond);
        const activees = options.filter((o) => this.store.actives().has(o.id)).length;
        return { produit: p.id, libelle: p.libelle, options: visibles, compteur: `${activees} / ${options.length} activées` };
      })
      .filter((g) => g.options.length > 0),
  );

  protected readonly customisations = computed(() =>
    this.premierNiveau().filter((o) => o.offre === 'customisation' && this.correspond(o)),
  );

  protected readonly annonce = computed(() => {
    const n = this.payantesDisponibles().length + this.groupesStandard().reduce((t, g) => t + g.options.length, 0) + this.customisations().length;
    return n ? `${n} ${n > 1 ? 'options affichées' : 'option affichée'}` : 'Aucune option ne correspond à votre recherche.';
  });

  protected libelleModule(module: ModuleEntreprise): string {
    return this.service.libelleModule(module);
  }

  protected compteurSousOptions(parent: OptionEntreprise): string {
    const sous = this.store.sousOptions(parent);
    return `${sous.filter((s) => this.store.estActive(s)).length} / ${sous.length} activées`;
  }

  /** Bloc ouvert : choix de l'utilisateur, sinon le premier ; tous ouverts pendant une recherche. */
  protected estOuvert(produit: ProduitOption, premier: boolean): boolean {
    if (this.store.recherche().trim()) return true;
    return this.ouverts().get(produit) ?? premier;
  }

  protected basculerGroupe(produit: ProduitOption, ouvert: boolean): void {
    this.ouverts.update((m) => new Map(m).set(produit, ouvert));
  }

  /** Une option payante activée rejoint l'offre : le focus suit sa puce « Désactiver ». */
  protected activer(option: OptionEntreprise, active: boolean): void {
    this.store.basculer(option, active);
    if (active) this.store.focaliser(`soc-labs-action-chip[data-option="${option.id}"] [data-part="action"]`);
  }

  /** Désactivée, l'option revient dans « Options payantes disponibles » : le focus suit son bouton « Activer ». */
  protected desactiver(option: OptionEntreprise): void {
    this.store.basculer(option, false);
    this.store.focaliser(`soc-labs-option-row[data-option="${option.id}"] [data-part="action"]`, '[data-testid="offre"] h2');
  }
}
