import { CdkDrag, CdkDragPlaceholder, CdkDropList, CdkDropListGroup, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideCheck, LucideEllipsis, LucideEye, LucideLibrary, LucidePencil, LucidePower, LucideRotateCcw, LucideTrash } from '@lucide/angular';
import {
  SocAccordion,
  SocBadge,
  SocBreadcrumb,
  SocButton,
  SocButtonLeftIcon,
  SocCard,
  SocCardFooter,
  SocCardGrid,
  SocDataTable,
  SocDialog,
  SocInputArea,
  SocInputText,
  SocMenu,
  SocMenuItem,
  SocMenuItemIcon,
  SocMessage,
  SocMessageContent,
  SocMultiSelect,
  SocPageActions,
  SocPageBadge,
  SocPageBreadcrumb,
  SocPageDetails,
  SocPageTag,
  SocPopover,
  SocPopoverTrigger,
  SocSelect,
  SocTag,
  SocTooltip,
  SocTooltipLabel,
  type DataTableCellContext,
  type DataTableColumn,
  type DialogAction,
  type MessageAction,
  type MultiSelectOption,
  type SelectOption,
  type TagColor,
} from '@socium-design/angular-components';
import { forkJoin, map } from 'rxjs';
import type { Employe } from '../../employes/models/employe.model';
import { EmployesService } from '../../employes/services/employes.service';
import { WidgetCarteComponent } from '../../tableau-de-bord/components/widget-carte.component';
import { TYPES_GRAPHIQUES } from '../../tableau-de-bord/models/graphique.types';
import { LIBELLES_PRODUITS, type Indicateur, type SerieIndicateur } from '../../tableau-de-bord/models/indicateur.model';
import type { StatutTableauDeBord, TableauDeBord } from '../../tableau-de-bord/models/tableau-de-bord.model';
import type { IndicateurCatalogue, SectionAvecIndicateurs } from '../../tableau-de-bord/services/catalogue';
import { CatalogueService } from '../../tableau-de-bord/services/catalogue.service';
import { TableauxDeBordService } from '../../tableau-de-bord/services/tableaux-de-bord.service';
import { construireSections, libelleFiltre, type SectionVue, type WidgetVue } from '../../tableau-de-bord/services/widgets';
import { LIBELLES_CHAMPS, libelleCondition, type Population } from '../populations/models/population.model';
import { employesCouverts, valeursDuChamp } from '../populations/services/population-regles';
import { PopulationsService } from '../populations/services/populations.service';

const LISTE = '/workspace/configuration/tableaux-de-bord';
const COULEURS_STATUT: Record<StatutTableauDeBord, TagColor> = { Actif: 'success', Inactif: 'information', Archivé: 'warning' };

/**
 * Workspace > Configuration > Gestion des tableaux de bord > « Voir détails » / composition (Bibliothèque).
 * - Par défaut (« Voir détails ») : lecture seule ; à gauche les informations générales du tableau, au centre ses widgets.
 * - `?mode=edition` (bouton « Modifier ») : au centre le tableau segmenté par section, à droite le catalogue (lecture seule),
 *   ajout au clic ou par glisser-déposer, personnalisation des widgets.
 * GAP-DS : pas de panneau latéral non modal (#9) ni de template à panneaux (#13) → page en colonnes ; glisser-déposer via le CDK (#8).
 */
@Component({
  selector: 'app-tableau-de-bord-composition-page',
  imports: [
    ReactiveFormsModule, CdkDropListGroup, CdkDropList, CdkDrag, CdkDragPlaceholder, SocPageDetails, SocPageBreadcrumb, SocPageBadge, SocPageTag, SocPageActions,
    SocBreadcrumb, SocBadge, SocTag, SocButton, SocButtonLeftIcon, SocTooltip, SocTooltipLabel, SocCard, SocCardFooter, SocCardGrid,
    SocAccordion, SocPopover, SocPopoverTrigger, SocMenu, SocMenuItem, SocMenuItemIcon, SocMessage, SocMessageContent, SocDialog,
    SocInputText, SocInputArea, SocSelect, SocMultiSelect, SocDataTable, WidgetCarteComponent, LucideLibrary, LucideCheck, LucideEye, LucidePower, LucideEllipsis,
    LucidePencil, LucideRotateCcw, LucideTrash,
  ],
  styleUrl: './tableau-de-bord-composition-page.component.scss',
  template: `
    <ng-template #criteresCell let-row>
      @if (population(); as pop) {
        <div class="infos__criteres">
          @for (condition of pop.conditions; track $index) {
            <soc-tag color="information">{{ libelleCondition(condition) }}</soc-tag>
          }
          <span class="repartition__libelle">{{ pop.combinaison === 'ET' ? 'toutes les conditions' : 'au moins une condition' }} · {{ nbCouverts() }} employé(s)</span>
        </div>
      }
    </ng-template>
    <ng-template #statutCell let-row>
      <soc-tag [color]="couleurStatut(row.statut)">{{ row.statut }}</soc-tag>
    </ng-template>

    @if (tableau(); as t) {
      <soc-page-details [title]="t.libelle" [description]="t.description" [showBack]="true" (back)="retourListe()">
        <soc-breadcrumb socPageBreadcrumb [items]="breadcrumb()" />
        <soc-badge socPageBadge color="primary">{{ t.widgets.length }}</soc-badge>
        <soc-tag socPageTag [color]="couleurStatut(t.statut)">{{ t.statut }}</soc-tag>

        @if (edition()) {
          <soc-tooltip socPageActions position="bottom">
            <button socButton variant="tertiary" size="lg" data-testid="bibliotheque" [attr.aria-label]="libelleBibliotheque()" [attr.aria-pressed]="bibliothequeOuverte()" (click)="basculerBibliotheque()">
            <svg lucideLibrary socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
          </button>
          <span socTooltipLabel>{{ libelleBibliotheque() }}</span>
          </soc-tooltip>
        }
        <soc-tooltip socPageActions position="bottom">
          <button socButton variant="tertiary" size="lg" data-testid="visualiser" [attr.aria-label]="apercu() ? 'Quitter l’aperçu' : 'Visualiser'" [attr.aria-pressed]="apercu()" (click)="basculerApercu()">
            <svg lucideEye socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
          </button>
          <span socTooltipLabel>{{ apercu() ? 'Quitter l’aperçu' : 'Visualiser le tableau de bord tel que le verra sa population' }}</span>
        </soc-tooltip>
        @if (edition()) {
          <soc-tooltip socPageActions position="bottom">
            <button socButton variant="tertiary" size="lg" data-testid="terminer" aria-label="Terminer la modification" (click)="changerMode(false)">
              <svg lucideCheck socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
            </button>
            <span socTooltipLabel>Terminer la modification</span>
          </soc-tooltip>
        } @else {
          <soc-tooltip socPageActions position="bottom">
            <button socButton variant="tertiary" size="lg" data-testid="modifier" aria-label="Modifier" (click)="changerMode(true)">
              <svg lucidePencil socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
            </button>
            <span socTooltipLabel>Modifier la composition (widgets, titres, filtres)</span>
          </soc-tooltip>
        }
        @if (t.statut !== 'Actif') {
          <soc-tooltip socPageActions position="bottom">
            <button socButton variant="tertiary" size="lg" data-testid="activer" aria-label="Activer" [disabled]="!t.previsualise" (click)="activer()">
              <svg lucidePower socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
            </button>
            <span socTooltipLabel>{{ t.previsualise ? 'Activer le tableau de bord' : 'Visualisez le tableau de bord avant de l’activer' }}</span>
          </soc-tooltip>
        }

        <div class="espace" [class.espace--bibliotheque]="panneauVisible()" [class.espace--infos]="infosVisibles()" cdkDropListGroup>
          @if (infosVisibles()) {
            <aside class="infos" aria-label="Informations générales" data-testid="infos">
              <soc-data-table mode="detail" title="Informations générales" [columns]="colonnesInfos()" [rows]="[t]" [rowKey]="cleTableau" />
              <button socButton type="button" variant="secondary" (click)="modifierInformations()">Modifier les informations</button>
            </aside>
          }
          <section class="composition" aria-label="Composition du tableau de bord">
            @if (apercu()) {
              <soc-message variant="banner" status="info" title="Aperçu" [primaryAction]="quitterApercu">
                <span socMessageContent>Voici le tableau de bord tel que le verront les employés de « {{ populationNom() }} ».</span>
              </soc-message>
            }
            @if (message()) {
              <soc-message variant="inline" status="success">
                <span socMessageContent data-testid="message">{{ message() }}</span>
              </soc-message>
            }
            <div class="repartition" data-testid="repartition">
              <span class="repartition__libelle">Répartition par section</span>
              @for (section of repartition(); track section.id) {
                <soc-tag color="purple">{{ section.libelle }} · {{ section.widgets.length }}</soc-tag>
              } @empty {
                <span class="repartition__libelle">aucun widget</span>
              }
            </div>

            @for (section of sections(); track section.id) {
              <div
                class="section"
                data-testid="section"
                cdkDropList
                [cdkDropListData]="section.id"
                [cdkDropListDisabled]="lectureSeule()"
                [cdkDropListSortingDisabled]="true"
                (cdkDropListDropped)="deposer($event)"
              >
                <div class="section__entete">
                  <p class="section__titre">{{ section.libelle }}</p>
                  <soc-badge color="primary">{{ section.widgets.length }}</soc-badge>
                  @if (!lectureSeule()) {
                    <soc-tooltip>
                      <button socButton variant="ghost" [attr.aria-label]="'Renommer la section ' + section.libelle" (click)="ouvrirRenommage(section)">
                        <svg lucidePencil socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
                      </button>
                      <span socTooltipLabel>Renommer la section (pour ce tableau de bord)</span>
                    </soc-tooltip>
                  }
                </div>
                @if (section.widgets.length) {
                  <soc-card-grid [columns]="panneauVisible() || infosVisibles() ? 2 : 3">
                    @for (vue of section.widgets; track vue.widget.id) {
                      <app-widget-carte [vue]="vue" data-testid="widget">
                        @if (!lectureSeule()) {
                          <soc-popover appWidgetActions position="bottom-end" [open]="menuOuvert() === vue.widget.id" (openChange)="menuOuvert.set($event ? vue.widget.id : null)">
                            <soc-tooltip socPopoverTrigger>
                              <button socButton variant="ghost" [attr.aria-label]="'Actions du widget ' + vue.titre">
                                <svg lucideEllipsis socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
                              </button>
                              <span socTooltipLabel>Actions</span>
                            </soc-tooltip>
                            <soc-menu>
                              <button socMenuItem label="Modifier" (click)="ouvrirEdition(vue)">
                                <svg lucidePencil socMenuItemIcon class="size-full" [strokeWidth]="1.5"></svg>
                              </button>
                              @if (vue.personnalise) {
                                <button socMenuItem label="Réinitialiser" (click)="reinitialiser(vue)">
                                  <svg lucideRotateCcw socMenuItemIcon class="size-full" [strokeWidth]="1.5"></svg>
                                </button>
                              } @else {
                                <soc-tooltip position="left">
                                  <button socMenuItem label="Réinitialiser" disabled>
                                    <svg lucideRotateCcw socMenuItemIcon class="size-full" [strokeWidth]="1.5"></svg>
                                  </button>
                                  <span socTooltipLabel>Titre et description sont déjà ceux du catalogue.</span>
                                </soc-tooltip>
                              }
                              <button socMenuItem label="Retirer du tableau de bord" (click)="retirer(vue)">
                                <svg lucideTrash socMenuItemIcon class="size-full" [strokeWidth]="1.5"></svg>
                              </button>
                            </soc-menu>
                          </soc-popover>
                        }
                      </app-widget-carte>
                    }
                  </soc-card-grid>
                } @else {
                  <soc-message variant="inline" status="info">
                    <span socMessageContent>Aucun widget dans cette section. Glissez-y un indicateur de la Bibliothèque.</span>
                  </soc-message>
                }
              </div>
            } @empty {
              <soc-message variant="inline" status="info">
                <span socMessageContent>Ce tableau de bord n'a encore aucun widget.</span>
              </soc-message>
            }
          </section>

          @if (widgetEdite(); as vue) {
            <!-- Panneau latéral d'édition (pas une soc-dialog : une liste déroulante y s'ouvre sous la modale, GAP-DS). -->
            <aside class="bibliotheque" aria-label="Modifier le widget" data-testid="edition-widget">
              <div class="bibliotheque__entete">
                <p class="section__titre">Modifier le widget</p>
                <p class="bibliotheque__aide">Indicateur du catalogue : {{ vue.indicateur.titre }}</p>
              </div>
              <form class="dialogue" [formGroup]="formWidget" (ngSubmit)="sauverWidget()">
                <soc-input-text formControlName="titre" label="Titre" [helperText]="'Vide = titre du catalogue : « ' + vue.indicateur.titre + ' »'" />
                <soc-input-area formControlName="description" label="Description" [maxlength]="140" helperText="Une phrase. Vide = description du catalogue." />
                <soc-select formControlName="sectionId" label="Section" [options]="optionsSections()" />
                <soc-multi-select formControlName="filtres" label="Filtres" placeholder="Choisir des filtres" [options]="optionsFiltres()" />
                <div class="edition__actions">
                  <button socButton type="button" variant="secondary" (click)="widgetEdite.set(null)">Annuler</button>
                  <button socButton type="submit">Enregistrer</button>
                </div>
              </form>
            </aside>
          } @else if (bibliothequeVisible()) {
            <aside class="bibliotheque" aria-label="Bibliothèque" data-testid="catalogue">
              <div class="bibliotheque__entete">
                <p class="section__titre">Bibliothèque</p>
                <p class="bibliotheque__aide">Cliquez sur un indicateur pour l'ajouter, ou glissez-le dans une section.</p>
              </div>
              @for (section of catalogue(); track section.id) {
                <soc-accordion [label]="section.libelle" [open]="true" data-testid="section-catalogue">
                  <div class="bibliotheque__liste" cdkDropList [cdkDropListSortingDisabled]="true" [cdkDropListEnterPredicate]="refuserDepot">
                    @for (indicateur of section.indicateurs; track indicateur.id) {
                      @if (indicateur.disponible) {
                        <div class="bibliotheque__item" cdkDrag [cdkDragData]="indicateur.id" data-testid="indicateur">
                          <!-- Emplacement vide : la section survolée ne s'agrandit pas pendant le glisser (sinon la page bouge sous le pointeur). -->
                          <div *cdkDragPlaceholder class="bibliotheque__emplacement"></div>
                          <soc-card type="selectable" [title]="indicateur.titre" [subtitle]="indicateur.description" (cardClick)="ajouter(indicateur)" (action)="detail.set(indicateur)">
                            <div socCardFooter class="bibliotheque__tags">
                              <soc-tag color="information">{{ typeGraphique(indicateur) }}</soc-tag>
                              @if (ajouts().get(indicateur.id); as n) {
                                <soc-tag color="success">Ajouté{{ n > 1 ? ' ×' + n : '' }}</soc-tag>
                              }
                            </div>
                          </soc-card>
                        </div>
                      } @else {
                        <soc-tooltip position="left" class="bibliotheque__item" data-testid="indicateur-indisponible">
                          <soc-card [title]="indicateur.titre" [subtitle]="indicateur.description" (action)="detail.set(indicateur)">
                            <div socCardFooter class="bibliotheque__tags">
                              <soc-tag color="warning">Non souscrit</soc-tag>
                            </div>
                          </soc-card>
                          <span socTooltipLabel>Indicateur du produit {{ produit(indicateur) }}, non souscrit : il ne peut pas être ajouté.</span>
                        </soc-tooltip>
                      }
                    }
                  </div>
                </soc-accordion>
              }
            </aside>
          }
        </div>
      </soc-page-details>

      <soc-dialog [open]="!!detail()" [title]="detail()?.titre ?? ''" [secondaryAction]="fermerDetail" (close)="detail.set(null)">
        @if (detail(); as ind) {
          <dl class="detail" data-testid="detail-indicateur">
            <dt>Description</dt><dd>{{ ind.description }}</dd>
            <dt>Type de graphique</dt><dd>{{ typeGraphique(ind) }}</dd>
            <dt>Variables / axes</dt><dd>{{ ind.axes }}</dd>
            <dt>Règle de calcul</dt><dd>{{ ind.regleCalcul }}</dd>
            <dt>Filtres disponibles</dt><dd>{{ filtresDisponibles(ind) }}</dd>
            <dt>Produit</dt><dd>{{ produit(ind) }}{{ ind.disponible ? '' : ' (non souscrit)' }}</dd>
          </dl>
        }
      </soc-dialog>

      <soc-dialog [open]="!!sectionRenommee()" title="Renommer la section" [primaryAction]="enregistrerSection" [secondaryAction]="annulerDialogue" (close)="sectionRenommee.set(null)">
        <soc-input-text
          [formControl]="nomSection"
          label="Nom de la section"
          required
          [error]="nomSection.touched && !nomSection.value.trim()"
          [helperText]="nomSection.touched && !nomSection.value.trim() ? 'Le nom est obligatoire.' : 'Le nouveau nom ne vaut que pour ce tableau de bord.'"
        />
      </soc-dialog>
    }
  `,
})
export class TableauDeBordCompositionPageComponent {
  private readonly router = inject(Router);
  private readonly service = inject(TableauxDeBordService);
  private readonly employes = toSignal(inject(EmployesService).getAll(), { initialValue: [] as Employe[] });

  private readonly route = inject(ActivatedRoute);
  protected readonly id = this.route.snapshot.paramMap.get('id')!;
  /** Mode édition (`?mode=edition`, bouton « Modifier ») ; sinon « Voir détails » en lecture seule. Porté par l'URL. */
  protected readonly edition = toSignal(this.route.queryParamMap.pipe(map((q) => q.get('mode') === 'edition')), {
    initialValue: this.route.snapshot.queryParamMap.get('mode') === 'edition',
  });
  protected readonly tableau = signal<TableauDeBord | undefined>(undefined);
  private readonly indicateurs = signal<Indicateur[]>([]);
  private readonly series = signal<SerieIndicateur[]>([]);
  protected readonly catalogue = signal<SectionAvecIndicateurs[]>([]);
  private readonly populations = signal<Population[]>([]);
  private readonly criteresCell = viewChild.required<TemplateRef<DataTableCellContext<TableauDeBord>>>('criteresCell');
  private readonly statutCell = viewChild.required<TemplateRef<DataTableCellContext<TableauDeBord>>>('statutCell');

  protected readonly bibliothequeOuverte = signal(true);
  protected readonly apercu = signal(false);
  /** Pas de modification possible : « Voir détails » ou aperçu. */
  protected readonly lectureSeule = computed(() => !this.edition() || this.apercu());
  protected readonly bibliothequeVisible = computed(() => this.edition() && this.bibliothequeOuverte() && !this.apercu());
  /** Colonne de gauche (informations générales) : en « Voir détails », hors aperçu. */
  protected readonly infosVisibles = computed(() => !this.edition() && !this.apercu());
  /** Une colonne latérale est affichée (Bibliothèque ou édition d'un widget). */
  protected readonly panneauVisible = computed(() => this.bibliothequeVisible() || !!this.widgetEdite());
  protected readonly menuOuvert = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly widgetEdite = signal<WidgetVue | null>(null);
  protected readonly sectionRenommee = signal<SectionVue | null>(null);
  /** Indicateur du catalogue dont on consulte le détail (bouton « ••• » de sa carte dans la Bibliothèque). */
  protected readonly detail = signal<IndicateurCatalogue | null>(null);

  protected readonly formWidget = new FormGroup({
    titre: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    sectionId: new FormControl('', { nonNullable: true }),
    filtres: new FormControl<string[]>([], { nonNullable: true }),
  });
  protected readonly nomSection = new FormControl('', { nonNullable: true });

  protected readonly breadcrumb = computed(() => [
    { label: 'Workspace' },
    { label: 'Configurations', onClick: () => this.retourListe() },
    { label: 'Gestion des tableaux de bord', onClick: () => this.retourListe() },
    { label: this.tableau()?.libelle ?? '' },
  ]);
  protected readonly libelleBibliotheque = computed(() => (this.bibliothequeOuverte() ? 'Masquer la Bibliothèque' : 'Ajouter un widget'));
  protected readonly population = computed(() => this.populations().find((p) => p.id === this.tableau()?.populationId));
  protected readonly populationNom = computed(() => this.population()?.nom ?? '—');
  protected readonly nbCouverts = computed(() => {
    const pop = this.population();
    return pop ? employesCouverts(pop, this.employes()).length : 0;
  });
  protected readonly cleTableau = (t: TableauDeBord) => t.id;
  protected readonly colonnesInfos = computed<DataTableColumn<TableauDeBord>[]>(() => [
    { key: 'libelle', header: 'Libellé', render: (t) => t.libelle },
    { key: 'description', header: 'Description', render: (t) => t.description || '—' },
    { key: 'population', header: 'Population', render: () => this.populationNom() },
    { key: 'criteres', header: 'Critères', render: this.criteresCell() },
    { key: 'statut', header: 'Statut', render: this.statutCell() },
    { key: 'creePar', header: 'Créé par', render: (t) => t.creePar.nom },
    { key: 'creeLe', header: 'Date de création', render: (t) => new Date(t.creeLe).toLocaleDateString('fr-FR') },
  ]);

  /** Sections du tableau ; en composition, les sections vides restent affichées comme cibles d'ajout. */
  protected readonly sections = computed(() => {
    const t = this.tableau();
    return t ? construireSections(t, this.indicateurs(), this.employes(), this.series(), !this.lectureSeule()) : [];
  });
  protected readonly repartition = computed(() => this.sections().filter((s) => s.widgets.length));
  /** Nombre de widgets par indicateur (un indicateur peut être ajouté plusieurs fois, avec des filtres différents). */
  protected readonly ajouts = computed(() => {
    const n = new Map<string, number>();
    for (const w of this.tableau()?.widgets ?? []) n.set(w.indicateurId, (n.get(w.indicateurId) ?? 0) + 1);
    return n;
  });

  protected readonly optionsSections = computed<SelectOption[]>(() => (this.tableau()?.sections ?? []).map((s) => ({ value: s.id, label: s.libelle })));
  protected readonly optionsFiltres = computed<MultiSelectOption[]>(() => {
    const vue = this.widgetEdite();
    if (!vue) return [];
    return vue.indicateur.filtresDisponibles.flatMap((champ) =>
      valeursDuChamp(champ, this.employes()).map((v) => ({ value: `${champ}:${v}`, label: libelleFiltre(`${champ}:${v}`) })),
    );
  });

  protected readonly quitterApercu: MessageAction = { label: 'Quitter l’aperçu', onClick: () => this.apercu.set(false) };
  protected readonly fermerDetail: DialogAction = { label: 'Fermer', onClick: () => this.detail.set(null) };
  protected readonly annulerDialogue: DialogAction = { label: 'Annuler', onClick: () => this.fermerDialogues() };
  protected readonly enregistrerSection: DialogAction = { label: 'Renommer', onClick: () => this.sauverSection() };
  /** La Bibliothèque est en lecture seule : on ne peut rien y déposer. */
  protected readonly refuserDepot = () => false;

  constructor() {
    const catalogue = inject(CatalogueService);
    forkJoin([this.service.getById(this.id), catalogue.getIndicateurs(), catalogue.getSeries(), catalogue.getCatalogue(), inject(PopulationsService).getAll()]).subscribe(
      ([tableau, indicateurs, series, sections, populations]) => {
        if (!tableau) return this.retourListe();
        this.indicateurs.set(indicateurs);
        this.series.set(series);
        this.catalogue.set(sections);
        this.populations.set(populations);
        this.tableau.set(tableau);
      },
    );
  }

  protected couleurStatut(statut: StatutTableauDeBord): TagColor {
    return COULEURS_STATUT[statut];
  }

  protected typeGraphique(indicateur: Indicateur): string {
    return TYPES_GRAPHIQUES[indicateur.typeGraphique].libelle;
  }

  protected filtresDisponibles(indicateur: Indicateur): string {
    return indicateur.filtresDisponibles.map((c) => LIBELLES_CHAMPS[c]).join(', ') || '—';
  }

  protected produit(indicateur: Indicateur): string {
    return LIBELLES_PRODUITS[indicateur.produit];
  }

  protected libelleCondition(c: Population['conditions'][number]): string {
    return libelleCondition(c);
  }

  /** « Modifier » ↔ « Terminer » : le mode est dans l'URL (`?mode=edition`). */
  protected changerMode(edition: boolean): void {
    this.apercu.set(false);
    this.widgetEdite.set(null);
    this.message.set(null);
    this.router.navigate([], { relativeTo: this.route, queryParams: { mode: edition ? 'edition' : null }, queryParamsHandling: 'merge' });
  }

  protected modifierInformations(): void {
    this.router.navigate(['/workspace/configuration/tableaux-de-bord', this.id, 'modifier']);
  }

  protected basculerBibliotheque(): void {
    this.apercu.set(false);
    this.widgetEdite.set(null);
    this.bibliothequeOuverte.update((o) => !o);
  }

  /** « Visualiser » : rendu tel que le verra la population ; la première prévisualisation rend le tableau activable. */
  protected basculerApercu(): void {
    const entrer = !this.apercu();
    this.widgetEdite.set(null);
    this.message.set(null);
    this.apercu.set(entrer);
    this.menuOuvert.set(null);
    if (entrer && !this.tableau()?.previsualise) this.service.marquerPrevisualise(this.id).subscribe((t) => this.tableau.set(t));
  }

  protected activer(): void {
    this.service.changerStatut(this.id, 'Actif').subscribe((t) => {
      this.tableau.set(t);
      this.message.set('Tableau de bord activé : il est maintenant visible par sa population.');
    });
  }

  protected ajouter(indicateur: IndicateurCatalogue, sectionId?: string): void {
    if (!indicateur.disponible) return;
    this.service.ajouterWidget(this.id, indicateur.id, sectionId).subscribe((t) => {
      this.tableau.set(t);
      const section = t.sections.find((s) => s.id === (sectionId ?? indicateur.sectionId));
      this.message.set(`« ${indicateur.titre} » ajouté à la section ${section?.libelle ?? ''}.`);
    });
  }

  /** Dépôt d'un indicateur de la Bibliothèque dans une section du tableau. */
  protected deposer(event: CdkDragDrop<string, unknown, string>): void {
    if (event.previousContainer === event.container) return;
    const indicateur = this.catalogue().flatMap((s) => s.indicateurs).find((i) => i.id === event.item.data);
    if (indicateur) this.ajouter(indicateur, event.container.data);
  }

  protected ouvrirEdition(vue: WidgetVue): void {
    this.menuOuvert.set(null);
    this.formWidget.reset({ titre: vue.titre, description: vue.description, sectionId: vue.widget.sectionId, filtres: [...vue.widget.filtres] });
    this.widgetEdite.set(vue);
  }

  protected reinitialiser(vue: WidgetVue): void {
    this.menuOuvert.set(null);
    this.service.reinitialiserWidget(this.id, vue.widget.id).subscribe((t) => {
      this.tableau.set(t);
      this.message.set(`« ${vue.indicateur.titre} » a retrouvé le titre et la description du catalogue.`);
    });
  }

  protected retirer(vue: WidgetVue): void {
    this.menuOuvert.set(null);
    this.service.retirerWidget(this.id, vue.widget.id).subscribe((t) => {
      this.tableau.set(t);
      this.message.set(`« ${vue.titre} » retiré du tableau de bord.`);
    });
  }

  protected ouvrirRenommage(section: SectionVue): void {
    this.nomSection.reset(section.libelle);
    this.sectionRenommee.set(section);
  }

  protected retourListe(): void {
    this.router.navigateByUrl(LISTE);
  }

  protected sauverWidget(): void {
    const vue = this.widgetEdite();
    if (!vue) return;
    this.service.modifierWidget(this.id, vue.widget.id, this.formWidget.getRawValue()).subscribe((t) => {
      this.tableau.set(t);
      this.widgetEdite.set(null);
    });
  }

  private sauverSection(): void {
    const section = this.sectionRenommee();
    this.nomSection.markAsTouched();
    if (!section || !this.nomSection.value.trim()) return;
    this.service.renommerSection(this.id, section.id, this.nomSection.value).subscribe((t) => {
      this.tableau.set(t);
      this.sectionRenommee.set(null);
    });
  }

  private fermerDialogues(): void {
    this.sectionRenommee.set(null);
  }
}
