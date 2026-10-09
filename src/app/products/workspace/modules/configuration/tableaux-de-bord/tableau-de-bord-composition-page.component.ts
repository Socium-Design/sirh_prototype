import { CdkDropList, CdkDropListGroup, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideCheck, LucideEllipsis, LucideEye, LucidePencil, LucideSave, LucideTrash } from '@lucide/angular';
import {
  SocBadge,
  SocBreadcrumb,
  SocButton,
  SocButtonLeftIcon,
  SocCardGrid,
  SocCheckbox,
  SocDialog,
  SocDrawerDetailItem,
  SocMenu,
  SocMenuItem,
  SocMenuItemIcon,
  SocMessage,
  SocMessageContent,
  SocPageActions,
  SocPageBreadcrumb,
  SocPageDetails,
  SocPageTag,
  SocPopover,
  SocPopoverTrigger,
  SocSelect,
  SocTag,
  SocTooltip,
  SocTooltipLabel,
  type DialogAction,
  type SelectOption,
} from '@socium-design/angular-components';
import { Subject, forkJoin, map, take, type Observable } from 'rxjs';
import type { Employe } from '../../employes/models/employe.model';
import { EmployesService } from '../../employes/services/employes.service';
import { WidgetCarteComponent } from '../../tableau-de-bord/components/widget-carte.component';
import type { Indicateur, SerieIndicateur } from '../../tableau-de-bord/models/indicateur.model';
import { LIBELLES_PROFILS, type Profil, type StatutTableauDeBord, type TableauDeBord } from '../../tableau-de-bord/models/tableau-de-bord.model';
import type { IndicateurCatalogue, SectionAvecIndicateurs } from '../../tableau-de-bord/services/catalogue';
import { CatalogueService } from '../../tableau-de-bord/services/catalogue.service';
import { ajouterWidget, modifierWidget, renommerSection, retirerWidget } from '../../tableau-de-bord/services/composition';
import { TableauxDeBordService } from '../../tableau-de-bord/services/tableaux-de-bord.service';
import { construireSections, construireWidgets, employesDuTableau, type WidgetVue } from '../../tableau-de-bord/services/widgets';
import type { Population } from '../populations/models/population.model';
import { PopulationsService } from '../populations/services/populations.service';
import { BibliothequeComponent } from './components/bibliotheque.component';
import { WidgetDialogComponent, type ModificationWidget } from './components/widget-dialog.component';
import type { AvecChangementsNonEnregistres } from './quitter-sans-enregistrer.guard';

const LISTE = '/workspace/configuration/tableaux-de-bord';
const PROFILS = Object.keys(LIBELLES_PROFILS) as Profil[];

/**
 * Workspace > Configuration > Gestion des tableaux de bord > composition d'un tableau de bord.
 * - « Détail » (par défaut) : lecture seule — informations à gauche, graphes au centre.
 * - `?mode=edition` (« Modifier ») : Bibliothèque à droite, ajout par « + » ou glisser-déposer, « Modifier le KPI », statut et
 *   profils modifiables ; les changements portent sur un brouillon enregistré par « Enregistrer » (→ « Enregistré ✓ »).
 * - « Prévisualiser » : le tableau en plein écran, sur données simulées.
 * GAP-DS : pas de template à panneaux (#13) → page en colonnes ; glisser-déposer via le CDK (#8).
 */
@Component({
  selector: 'app-tableau-de-bord-composition-page',
  host: { '(window:beforeunload)': 'avertirAvantDechargement($event)' },
  imports: [
    CdkDropListGroup, CdkDropList, SocPageDetails, SocPageBreadcrumb, SocPageTag, SocPageActions, SocBreadcrumb, SocBadge, SocTag, SocButton,
    SocButtonLeftIcon, SocTooltip, SocTooltipLabel, SocCardGrid, SocPopover, SocPopoverTrigger, SocMenu, SocMenuItem, SocMenuItemIcon, SocMessage,
    SocMessageContent, SocDialog, SocDrawerDetailItem, SocSelect, SocCheckbox, WidgetCarteComponent, BibliothequeComponent, WidgetDialogComponent,
    LucideEye, LucidePencil, LucideSave, LucideCheck, LucideEllipsis, LucideTrash,
  ],
  styleUrl: './tableau-de-bord-composition-page.component.scss',
  template: `
    @if (brouillon(); as t) {
      @if (apercu()) {
        <soc-page-details
          [title]="t.libelle"
          [description]="'Prévisualisation · ' + populationNom() + ' · ' + vues().length + ' KPIs'"
          [showBack]="true"
          backLabel="Retour à la composition"
          (back)="apercu.set(false)"
        >
          <soc-tag socPageTag color="information">Données simulées</soc-tag>
          <div class="apercu" data-testid="apercu">
            @if (kpis().length) {
              <soc-card-grid [columns]="4">
                @for (vue of kpis(); track vue.widget.id) {
                  <app-widget-carte [vue]="vue" [avecPied]="false" data-testid="apercu-widget" />
                }
              </soc-card-grid>
            }
            @if (graphes().length) {
              <soc-card-grid [columns]="2">
                @for (vue of graphes(); track vue.widget.id) {
                  <app-widget-carte [vue]="vue" [avecPied]="false" data-testid="apercu-widget" />
                }
              </soc-card-grid>
            }
            @if (!vues().length) {
              <soc-message variant="banner" status="info" title="Aucun KPI">
                <span socMessageContent>Aucun KPI ajouté — retournez à la bibliothèque pour en ajouter.</span>
              </soc-message>
            }
          </div>
        </soc-page-details>
      } @else {
        <soc-page-details
          [title]="t.libelle"
          [description]="edition() ? 'Ajouter des graphes depuis la bibliothèque →' : undefined"
          [showBack]="true"
          (back)="retourListe()"
        >
          <soc-breadcrumb socPageBreadcrumb [items]="breadcrumb()" />
          @if (!edition()) {
            <soc-tag socPageTag color="information">Lecture seule</soc-tag>
          }

          <soc-tooltip socPageActions position="bottom">
            <button socButton variant="tertiary" size="lg" aria-label="Prévisualiser" data-testid="previsualiser" (click)="apercu.set(true)">
              <svg lucideEye socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
            </button>
            <span socTooltipLabel>Prévisualiser</span>
          </soc-tooltip>
          @if (edition()) {
            <soc-tooltip socPageActions position="bottom">
              <button socButton variant="tertiary" size="lg" data-testid="enregistrer" [attr.aria-label]="enregistre() ? 'Enregistré ✓' : 'Enregistrer'" (click)="enregistrer()">
                @if (enregistre()) {
                  <svg lucideCheck socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
                } @else {
                  <svg lucideSave socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
                }
              </button>
              <span socTooltipLabel>{{ enregistre() ? 'Enregistré ✓' : 'Enregistrer' }}</span>
            </soc-tooltip>
          } @else {
            <soc-tooltip socPageActions position="bottom">
              <button socButton variant="tertiary" size="lg" aria-label="Modifier" data-testid="modifier" (click)="modifier()">
                <svg lucidePencil socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
              </button>
              <span socTooltipLabel>Modifier</span>
            </soc-tooltip>
          }

          <div class="espace" [class.espace--edition]="edition()" cdkDropListGroup>
            <aside class="infos" aria-label="Informations" data-testid="infos">
              <p class="infos__titre">INFORMATIONS</p>
              <soc-drawer-detail-item label="Libellé" [value]="t.libelle" />
              <soc-drawer-detail-item label="Description" [value]="t.description || '—'" />
              <soc-drawer-detail-item label="Population" [value]="populationNom()" />
              @if (!edition()) {
                <soc-drawer-detail-item label="Statut" [value]="t.statut" />
                <soc-drawer-detail-item label="Profils" [value]="libellesProfils(t.profils)" />
              } @else {
                <soc-select label="Statut" [options]="optionsStatuts" [value]="t.statut" (valueChange)="changerStatut($event)" />
                <div class="infos__profils" role="group" aria-label="Profils">
                  <span class="infos__libelle">Profils</span>
                  @for (profil of profils; track profil) {
                    <soc-checkbox [id]="'profil-' + profil" [label]="libellesProfils([profil])" [checked]="t.profils.includes(profil)" (checkedChange)="basculerProfil(profil, $event)" />
                  }
                </div>
              }
            </aside>

            <section
              class="composition"
              aria-label="Composition du dashboard"
              cdkDropList
              [cdkDropListDisabled]="!edition()"
              [cdkDropListSortingDisabled]="true"
              (cdkDropListDropped)="deposer($event)"
              data-testid="composition"
            >
              <p class="composition__titre">Composition du dashboard · {{ vues().length }} graphe(s)</p>
              @for (section of sections(); track section.id) {
                <div class="section" data-testid="section">
                  <div class="section__entete">
                    <p class="section__titre">{{ section.libelle }}</p>
                    <soc-badge color="primary">{{ section.widgets.length }} KPI</soc-badge>
                  </div>
                  <soc-card-grid [columns]="3">
                    @for (vue of section.widgets; track vue.widget.id) {
                      <app-widget-carte [vue]="vue" [compact]="true" data-testid="widget">
                        @if (edition()) {
                          <soc-popover appWidgetActions position="bottom-end" [open]="menuOuvert() === vue.widget.id" (openChange)="menuOuvert.set($event ? vue.widget.id : null)">
                            <soc-tooltip socPopoverTrigger>
                              <button socButton variant="ghost" [attr.aria-label]="'Actions du graphe ' + vue.titre">
                                <svg lucideEllipsis socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
                              </button>
                              <span socTooltipLabel>Actions</span>
                            </soc-tooltip>
                            <soc-menu>
                              <button socMenuItem label="Modifier" (click)="ouvrirEdition(vue)">
                                <svg lucidePencil socMenuItemIcon class="size-full" [strokeWidth]="1.5"></svg>
                              </button>
                              <button socMenuItem label="Retirer" (click)="retirer(vue)">
                                <svg lucideTrash socMenuItemIcon class="size-full" [strokeWidth]="1.5"></svg>
                              </button>
                            </soc-menu>
                          </soc-popover>
                        }
                        <div appWidgetPied class="widget__filtres" data-testid="filtres">
                          @for (filtre of vue.filtres; track filtre.valeur) {
                            <soc-tag color="information">{{ filtre.libelle }}</soc-tag>
                          } @empty {
                            <span class="widget__sans-filtre">Aucun filtre</span>
                          }
                        </div>
                      </app-widget-carte>
                    }
                  </soc-card-grid>
                </div>
              } @empty {
                <soc-message variant="inline" status="info" data-testid="composition-vide">
                  <span socMessageContent>{{ edition() ? 'Cliquez sur un graphe dans la bibliothèque →' : 'Aucun graphe dans ce tableau de bord.' }}</span>
                </soc-message>
              }
            </section>

            @if (edition()) {
              <app-bibliotheque [catalogue]="catalogue()" [tableau]="t" (ajouter)="ajouter($event)" (renommerSection)="renommer($event.sectionId, $event.libelle)" />
            }
          </div>
        </soc-page-details>

        <app-widget-dialog [vue]="widgetEdite()" [sections]="t.sections" [employes]="employes()" (enregistre)="sauverWidget($event)" (annule)="widgetEdite.set(null)" />

        <soc-dialog [open]="confirmationQuitter()" title="Quitter sans enregistrer ?" [primaryAction]="quitter" [secondaryAction]="rester" (close)="repondre(false)">
          <p data-testid="quitter">Les modifications de « {{ t.libelle }} » n'ont pas été enregistrées. Elles seront perdues si vous quittez la page.</p>
        </soc-dialog>
      }
    }
  `,
})
export class TableauDeBordCompositionPageComponent implements AvecChangementsNonEnregistres {
  private readonly router = inject(Router);
  private readonly service = inject(TableauxDeBordService);
  protected readonly employes = toSignal(inject(EmployesService).getAll(), { initialValue: [] as Employe[] });

  private readonly route = inject(ActivatedRoute);
  protected readonly id = this.route.snapshot.paramMap.get('id')!;
  /** Mode édition (`?mode=edition`, bouton « Modifier ») ; sinon « Détail » en lecture seule. Porté par l'URL. */
  protected readonly edition = toSignal(this.route.queryParamMap.pipe(map((q) => q.get('mode') === 'edition')), {
    initialValue: this.route.snapshot.queryParamMap.get('mode') === 'edition',
  });

  /** Version enregistrée, et brouillon affiché (identique hors édition). */
  private readonly enregistreSurServeur = signal<TableauDeBord | undefined>(undefined);
  protected readonly brouillon = signal<TableauDeBord | undefined>(undefined);
  /** Vrai juste après « Enregistrer », jusqu'à la modification suivante (« Enregistré ✓ »). */
  protected readonly enregistre = signal(false);
  /** Le brouillon diffère de la version enregistrée (graphes, sections, statut, profils). */
  protected readonly modifie = computed(() => {
    const brouillon = this.brouillon();
    const enregistre = this.enregistreSurServeur();
    return !!brouillon && !!enregistre && JSON.stringify(composition(brouillon)) !== JSON.stringify(composition(enregistre));
  });
  /** Confirmation « Quitter sans enregistrer ? » en cours, et la réponse attendue par la garde de sortie. */
  protected readonly confirmationQuitter = signal(false);
  private reponseQuitter?: Subject<boolean>;
  protected readonly quitter: DialogAction = { label: 'Quitter sans enregistrer', onClick: () => this.repondre(true) };
  protected readonly rester: DialogAction = { label: 'Rester sur la page', onClick: () => this.repondre(false) };

  private readonly indicateurs = signal<Indicateur[]>([]);
  private readonly series = signal<SerieIndicateur[]>([]);
  protected readonly catalogue = signal<SectionAvecIndicateurs[]>([]);
  private readonly populations = signal<Population[]>([]);

  protected readonly apercu = signal(false);
  protected readonly menuOuvert = signal<string | null>(null);
  protected readonly widgetEdite = signal<WidgetVue | null>(null);

  protected readonly profils = PROFILS;
  protected readonly optionsStatuts: SelectOption[] = ['Actif', 'Inactif', 'Archivé'].map((s) => ({ value: s, label: s }));

  protected readonly breadcrumb = computed(() => [
    { label: 'Workspace' },
    { label: 'Configurations', onClick: () => this.retourListe() },
    { label: 'Gestion des tableaux de bord', onClick: () => this.retourListe() },
    { label: this.brouillon()?.libelle ?? '' },
  ]);
  protected readonly populationNom = computed(() => this.populations().find((p) => p.id === this.brouillon()?.populationId)?.nom ?? '—');
  /** Employés du périmètre : ceux de la population du tableau. */
  private readonly perimetre = computed(() => {
    const t = this.brouillon();
    return t ? employesDuTableau(t, this.populations(), this.employes()) : [];
  });
  protected readonly sections = computed(() => {
    const t = this.brouillon();
    return t ? construireSections(t, this.indicateurs(), this.perimetre(), this.series()) : [];
  });
  protected readonly vues = computed(() => {
    const t = this.brouillon();
    return t ? construireWidgets(t, this.indicateurs(), this.perimetre(), this.series()) : [];
  });
  /** Prévisualisation : cartes KPI en haut, puis les graphes sur 2 colonnes. */
  protected readonly kpis = computed(() => this.vues().filter((v) => v.indicateur.typeGraphique === 'kpi'));
  protected readonly graphes = computed(() => this.vues().filter((v) => v.indicateur.typeGraphique !== 'kpi'));

  constructor() {
    const catalogue = inject(CatalogueService);
    forkJoin([this.service.getById(this.id), catalogue.getIndicateurs(), catalogue.getSeries(), catalogue.getCatalogue(), inject(PopulationsService).getAll()]).subscribe(
      ([tableau, indicateurs, series, sections, populations]) => {
        if (!tableau) return this.retourListe();
        this.indicateurs.set(indicateurs);
        this.series.set(series);
        this.catalogue.set(sections);
        this.populations.set(populations);
        this.enregistreSurServeur.set(tableau);
        this.brouillon.set(structuredClone(tableau));
      },
    );
  }

  protected libellesProfils(profils: Profil[]): string {
    return profils.map((p) => LIBELLES_PROFILS[p]).join(', ') || '—';
  }

  /** « Modifier » : passe en édition (le mode est dans l'URL). */
  protected modifier(): void {
    this.enregistre.set(false);
    this.router.navigate([], { relativeTo: this.route, queryParams: { mode: 'edition' }, queryParamsHandling: 'merge' });
  }

  protected enregistrer(): void {
    const t = this.brouillon();
    if (!t) return;
    const { widgets, sections, statut, profils } = t;
    this.service.enregistrerComposition(this.id, { widgets, sections, statut, profils }).subscribe((enregistre) => {
      this.enregistreSurServeur.set(enregistre);
      this.enregistre.set(true);
    });
  }

  protected ajouter(indicateur: IndicateurCatalogue): void {
    if (indicateur.disponible) this.modifierBrouillon((t) => ajouterWidget(t, indicateur));
  }

  /** Dépôt d'un indicateur de la Bibliothèque dans la composition. */
  protected deposer(event: CdkDragDrop<unknown, unknown, string>): void {
    if (event.previousContainer === event.container) return;
    const indicateur = this.catalogue().flatMap((s) => s.indicateurs).find((i) => i.id === event.item.data);
    if (indicateur) this.ajouter(indicateur);
  }

  protected retirer(vue: WidgetVue): void {
    this.menuOuvert.set(null);
    this.modifierBrouillon((t) => retirerWidget(t, vue.widget.id));
  }

  protected ouvrirEdition(vue: WidgetVue): void {
    this.menuOuvert.set(null);
    this.widgetEdite.set(vue);
  }

  protected sauverWidget(modification: ModificationWidget): void {
    const vue = this.widgetEdite();
    this.widgetEdite.set(null);
    if (vue) this.modifierBrouillon((t) => modifierWidget(t, vue.widget.id, vue.indicateur, modification));
  }

  protected renommer(sectionId: string, libelle: string): void {
    this.modifierBrouillon((t) => renommerSection(t, sectionId, libelle));
  }

  protected changerStatut(statut: string | undefined): void {
    if (statut) this.modifierBrouillon((t) => ({ ...t, statut: statut as StatutTableauDeBord }));
  }

  protected basculerProfil(profil: Profil, coche: boolean): void {
    this.modifierBrouillon((t) => ({ ...t, profils: PROFILS.filter((p) => (p === profil ? coche : t.profils.includes(p))) }));
  }

  /** Garde de sortie : sans changement non enregistré, on part ; sinon on demande confirmation. */
  peutQuitter(): boolean | Observable<boolean> {
    if (!this.modifie()) return true;
    this.reponseQuitter?.complete();
    this.reponseQuitter = new Subject<boolean>();
    this.confirmationQuitter.set(true);
    return this.reponseQuitter.pipe(take(1));
  }

  /** Fermeture ou rechargement de l'onglet avec des changements non enregistrés : avertissement du navigateur. */
  protected avertirAvantDechargement(event: BeforeUnloadEvent): void {
    if (this.modifie()) event.preventDefault();
  }

  protected repondre(quitter: boolean): void {
    this.confirmationQuitter.set(false);
    this.reponseQuitter?.next(quitter);
    this.reponseQuitter = undefined;
  }

  protected retourListe(): void {
    this.router.navigateByUrl(LISTE);
  }

  private modifierBrouillon(changement: (t: TableauDeBord) => TableauDeBord): void {
    const t = this.brouillon();
    if (!t) return;
    this.brouillon.set(changement(t));
    this.enregistre.set(false);
  }
}

/** Ce que « Enregistrer » persiste : sert à détecter les changements non enregistrés. */
const composition = ({ widgets, sections, statut, profils }: TableauDeBord) => ({ widgets, sections, statut, profils });
