import { CdkDropList, CdkDropListGroup, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideArrowLeft, LucideCheck, LucideEllipsis, LucideEye, LucidePencil, LucideTrash } from '@lucide/angular';
import {
  SocButton,
  SocButtonLeftIcon,
  SocButtonRightIcon,
  SocCardGrid,
  SocDialog,
  SocMenu,
  SocMenuItem,
  SocMenuItemIcon,
  SocMessage,
  SocMessageContent,
  SocPopover,
  SocPopoverTrigger,
  SocTag,
  type DialogAction,
  type TagColor,
} from '@socium-design/angular-components';
import { Subject, forkJoin, map, take, type Observable } from 'rxjs';
import {
  SocLabsCompactField,
  SocLabsDropZone,
  SocLabsFullscreenOverlay,
  SocLabsIconButton,
  SocLabsOverlayBadge,
  SocLabsPillToggle,
  SocLabsWorkspaceActions,
  SocLabsWorkspaceBack,
  SocLabsWorkspaceHint,
  SocLabsWorkspaceLayout,
  SocLabsWorkspaceLeft,
  SocLabsWorkspaceRight,
  SocLabsWorkspaceTitle,
  type LabsCompactFieldOption,
  type LabsPillOption,
} from '../../../../../shared/labs/labs';
import type { Employe } from '../../employes/models/employe.model';
import { EmployesService } from '../../employes/services/employes.service';
import { WidgetCarteComponent } from '../../tableau-de-bord/components/widget-carte.component';
import type { Indicateur, SerieIndicateur } from '../../tableau-de-bord/models/indicateur.model';
import { type Produit, type StatutTableauDeBord, type TableauDeBord } from '../../tableau-de-bord/models/tableau-de-bord.model';
import type { WorkflowPersonnalise } from '../../tableau-de-bord/models/workflow.model';
import type { IndicateurCatalogue, SectionAvecIndicateurs } from '../../tableau-de-bord/services/catalogue';
import { CatalogueService } from '../../tableau-de-bord/services/catalogue.service';
import { ajouterWidget, modifierWidget, renommerSection, retirerWidget, type ParametresStatistique } from '../../tableau-de-bord/services/composition';
import { TableauxDeBordService, type Composition } from '../../tableau-de-bord/services/tableaux-de-bord.service';
import { construireSections, construireWidgets, type ContexteWidgets, type ValeursCriteres, type WidgetVue } from '../../tableau-de-bord/services/widgets';
import type { ChoixCritere } from '../../tableau-de-bord/components/widget-carte.component';
import type { Population } from '../populations/models/population.model';
import { PopulationsService } from '../populations/services/populations.service';
import { BibliothequeComponent } from './components/bibliotheque.component';
import { StatistiqueWorkflowDialogComponent } from './components/statistique-workflow-dialog.component';
import { WidgetDialogComponent, type ModificationWidget } from './components/widget-dialog.component';
import type { AvecChangementsNonEnregistres } from './quitter-sans-enregistrer.guard';

const LISTE = '/workspace/configuration/tableaux-de-bord';
/** Largeur d'écran sous laquelle les panneaux « Informations » et « Bibliothèque » deviennent repliables (PC portables). */
export const LARGEUR_PANNEAUX_REPLIABLES = 1280;

/**
 * Workspace > Configuration > Gestion des tableaux de bord > composition d'un tableau de bord (GabaritComposerPage du Figma Make).
 * Espace de travail `soc-labs-workspace-layout` : barre du haut (retour, nom, « Lecture seule » ou indication, actions),
 * panneau « Informations » à gauche, composition au centre, Bibliothèque à droite (édition) ; chaque colonne défile seule.
 * - « Détail » (par défaut) : lecture seule.
 * - `?mode=edition` (« Modifier ») : informations (libellé, description, produit, population adressée) et statut modifiables,
 *   ajout depuis la Bibliothèque par « + » ou glisser-déposer (une statistique de workflow personnalisé demande son nom et
 *   son workflow), « Modifier le KPI » ; les changements portent sur un brouillon enregistré par « Enregistrer » (→ « Enregistré ✓ »).
 * - Sous 1280 px de large, les panneaux « Informations » et « Bibliothèque » sont repliables (Labs, GAP-DS design_system_angular#34).
 * - « Prévisualiser » : le tableau en plein écran (`soc-labs-fullscreen-overlay`), sur données simulées.
 * Composants Labs (expérimentaux) : importés via `shared/labs/labs.ts`.
 */
@Component({
  selector: 'app-tableau-de-bord-composition-page',
  host: { '(window:beforeunload)': 'avertirAvantDechargement($event)' },
  imports: [
    CdkDropListGroup, CdkDropList, SocTag, SocButton, SocButtonLeftIcon, SocButtonRightIcon, SocCardGrid, SocPopover, SocPopoverTrigger, SocMenu, SocMenuItem,
    SocMenuItemIcon, SocMessage, SocMessageContent, SocDialog, SocLabsWorkspaceLayout, SocLabsWorkspaceBack, SocLabsWorkspaceTitle,
    SocLabsWorkspaceHint, SocLabsWorkspaceActions, SocLabsWorkspaceLeft, SocLabsWorkspaceRight, SocLabsCompactField, SocLabsPillToggle,
    SocLabsIconButton, SocLabsDropZone, SocLabsFullscreenOverlay, SocLabsOverlayBadge, WidgetCarteComponent, BibliothequeComponent,
    WidgetDialogComponent, StatistiqueWorkflowDialogComponent, LucideArrowLeft, LucideEye, LucidePencil, LucideCheck, LucideEllipsis, LucideTrash,
  ],
  styleUrl: './tableau-de-bord-composition-page.component.scss',
  template: `
    @if (brouillon(); as t) {
      <soc-labs-workspace-layout
        leftWidth="240px"
        rightWidth="280px"
        [collapsibleBelow]="largeurRepliable"
        [(leftCollapsed)]="infosRepliees"
        [(rightCollapsed)]="bibliothequeRepliee"
        cdkDropListGroup
      >
        <soc-labs-icon-button socLabsWorkspaceBack size="md" ariaLabel="Retour à la liste" tooltip="Retour à la liste" tooltipPosition="bottom" (click)="retourListe()">
          <svg lucideArrowLeft class="size-full"></svg>
        </soc-labs-icon-button>
        <h1 socLabsWorkspaceTitle class="titre">{{ t.libelle || 'Sans titre' }}</h1>
        @if (edition()) {
          <span socLabsWorkspaceHint class="indication">Ajouter des graphes depuis la bibliothèque →</span>
        } @else {
          <soc-tag socLabsWorkspaceHint color="information">Lecture seule</soc-tag>
        }
        <div socLabsWorkspaceActions class="actions">
          <button socButton variant="tertiary" data-testid="previsualiser" (click)="apercu.set(true)">
            <svg lucideEye socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
            Prévisualiser
          </button>
          @if (!edition()) {
            <button socButton data-testid="modifier" (click)="modifier()">
              <svg lucidePencil socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
              Modifier
            </button>
          } @else if (enregistre()) {
            <button socButton variant="secondary" class="enregistre" data-testid="enregistrer" aria-label="Enregistré ✓" (click)="enregistrer()">
              Enregistré
              <svg lucideCheck socButtonRightIcon class="size-full" [strokeWidth]="2" aria-hidden="true"></svg>
            </button>
          } @else {
            <button socButton data-testid="enregistrer" [disabled]="!t.libelle.trim()" (click)="enregistrer()">Enregistrer</button>
          }
        </div>

        <div socLabsWorkspaceLeft class="infos" data-testid="infos">
          <p class="infos__titre">INFORMATIONS</p>
          <soc-labs-compact-field size="sm" label="Libellé" [mode]="mode()" [value]="t.libelle" (valueChange)="changerInfos({ libelle: $event })" data-testid="libelle" />
          <soc-labs-compact-field
            size="sm"
            label="Description"
            control="textarea"
            [mode]="mode()"
            [value]="t.description"
            (valueChange)="changerInfos({ description: $event })"
            data-testid="description"
          />
          <soc-labs-compact-field
            size="sm"
            label="Produit"
            control="select"
            [mode]="mode()"
            [options]="optionsProduits()"
            [value]="t.produit"
            (valueChange)="changerProduit($event)"
            data-testid="produit"
          />
          <soc-labs-compact-field
            size="sm"
            label="Population adressée"
            control="select"
            [mode]="mode()"
            [options]="optionsPopulations()"
            [value]="t.populationId ?? ''"
            (valueChange)="changerInfos({ populationId: $event || null })"
            data-testid="population"
          />
          <div class="infos__champ">
            <span class="infos__libelle" id="statut-libelle">Statut</span>
            @if (edition()) {
              <soc-labs-pill-toggle ariaLabel="Statut" size="sm" [options]="optionsStatuts" [value]="t.statut" (valueChange)="changerStatut($event)" data-testid="statut" />
            } @else {
              <soc-tag class="infos__statut" [color]="couleursStatuts[t.statut]" data-testid="statut">{{ t.statut }}</soc-tag>
            }
          </div>
        </div>

        <div
          class="composition"
          [class.composition--survol]="survol()"
          cdkDropList
          [cdkDropListDisabled]="!edition()"
          [cdkDropListSortingDisabled]="true"
          (cdkDropListEntered)="survol.set(true)"
          (cdkDropListExited)="survol.set(false)"
          (cdkDropListDropped)="deposer($event)"
          data-testid="composition"
        >
          <p class="composition__titre">Composition du dashboard · {{ vues().length }} graphe(s)</p>
          @for (section of sections(); track section.id) {
            <div class="section" data-testid="section">
              <div class="section__entete">
                <p class="section__titre">{{ section.libelle }}</p>
                <span class="section__compte" data-testid="compte-section">{{ section.widgets.length }} KPI</span>
              </div>
              <soc-card-grid [columns]="colonnes()">
                @for (vue of section.widgets; track vue.widget.id) {
                  <app-widget-carte [vue]="vue" [compact]="true" (critere)="changerCritere(vue.widget.id, $event)" data-testid="widget">
                    @if (edition()) {
                      <soc-popover appWidgetActions position="bottom-end" [open]="menuOuvert() === vue.widget.id" (openChange)="menuOuvert.set($event ? vue.widget.id : null)">
                        <soc-labs-icon-button socPopoverTrigger [ariaLabel]="'Actions du graphe ' + vue.titre" tooltip="Actions">
                          <svg lucideEllipsis class="size-full"></svg>
                        </soc-labs-icon-button>
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
                  </app-widget-carte>
                }
              </soc-card-grid>
            </div>
          }
          @if (edition()) {
            @if (vues().length) {
              <soc-labs-drop-zone variant="slot" label="Ajouter un graphe depuis la bibliothèque" [active]="survol()" (activate)="chercherDansBibliotheque()" data-testid="emplacement" />
            } @else {
              <soc-labs-drop-zone
                label="Cliquez sur un graphe dans la bibliothèque →"
                hint="ou glissez-le ici"
                [active]="survol()"
                (activate)="chercherDansBibliotheque()"
                data-testid="composition-vide"
              />
            }
          } @else if (!vues().length) {
            <soc-message variant="inline" status="info" data-testid="composition-vide">
              <span socMessageContent>Aucun graphe dans ce tableau de bord.</span>
            </soc-message>
          }
        </div>

        @if (edition()) {
          <app-bibliotheque socLabsWorkspaceRight data-testid="bibliotheque" [catalogue]="catalogue()" [tableau]="t" (ajouter)="ajouter($event)" (renommerSection)="renommer($event.sectionId, $event.libelle)" />
        }
      </soc-labs-workspace-layout>

      <soc-labs-fullscreen-overlay
        [(open)]="apercu"
        [title]="t.libelle || 'Sans titre'"
        [subtitle]="'Prévisualisation · ' + populationNom() + ' · ' + vues().length + ' KPIs'"
        closeLabel="Fermer la prévisualisation"
      >
        <soc-tag socLabsOverlayBadge color="information">Données simulées</soc-tag>
        @if (apercu()) {
          <div class="apercu" data-testid="apercu">
            @if (kpis().length) {
              <soc-card-grid [columns]="4">
                @for (vue of kpis(); track vue.widget.id) {
                  <app-widget-carte [vue]="vue" (critere)="changerCritere(vue.widget.id, $event)" data-testid="apercu-widget" />
                }
              </soc-card-grid>
            }
            @if (graphes().length) {
              <soc-card-grid [columns]="2">
                @for (vue of graphes(); track vue.widget.id) {
                  <app-widget-carte [vue]="vue" (critere)="changerCritere(vue.widget.id, $event)" data-testid="apercu-widget" />
                }
              </soc-card-grid>
            }
            @if (!vues().length) {
              <soc-message variant="banner" status="info" title="Aucun KPI">
                <span socMessageContent>Aucun KPI ajouté — retournez à la bibliothèque pour en ajouter.</span>
              </soc-message>
            }
          </div>
        }
      </soc-labs-fullscreen-overlay>

      <app-widget-dialog
        [vue]="widgetEdite()"
        [sections]="t.sections"
        [populations]="populations()"
        (enregistre)="sauverWidget($event)"
        (annule)="widgetEdite.set(null)"
      />

      <app-statistique-workflow-dialog
        [open]="!!statistiqueAAjouter()"
        [workflows]="workflows()"
        (ajoute)="ajouterStatistique($event)"
        (annule)="statistiqueAAjouter.set(null)"
      />

      <soc-dialog [open]="confirmationQuitter()" title="Quitter sans enregistrer ?" [primaryAction]="quitter" [secondaryAction]="rester" (close)="repondre(false)">
        <p data-testid="quitter">Les modifications de « {{ t.libelle }} » n'ont pas été enregistrées. Elles seront perdues si vous quittez la page.</p>
      </soc-dialog>
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
  /** Le brouillon diffère de la version enregistrée (informations, graphes, sections, statut). */
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
  protected readonly populations = signal<Population[]>([]);
  protected readonly workflows = signal<WorkflowPersonnalise[]>([]);
  private readonly produits = signal<Produit[]>([]);
  /** Statistique générique en attente de son nom et de son workflow (modale d'ajout). */
  protected readonly statistiqueAAjouter = signal<IndicateurCatalogue | null>(null);

  /** Panneaux repliables sous 1280 px ; repliés par le layout en entrant sous ce seuil. */
  protected readonly largeurRepliable = LARGEUR_PANNEAUX_REPLIABLES;
  protected readonly infosRepliees = signal(false);
  protected readonly bibliothequeRepliee = signal(false);
  /** Cartes sur 3 colonnes sur grand écran, 2 en dessous de 1440 px (zone centrale trop étroite sinon). */
  private readonly grandEcran = toSignal(inject(BreakpointObserver).observe('(min-width: 1440px)').pipe(map((r) => r.matches)), { initialValue: true });
  protected readonly colonnes = computed(() => (this.grandEcran() ? 3 : 2));

  protected readonly apercu = signal(false);
  /** Un graphe de la Bibliothèque est glissé au-dessus de la composition. */
  protected readonly survol = signal(false);
  private readonly bibliotheque = viewChild(BibliothequeComponent);
  protected readonly menuOuvert = signal<string | null>(null);
  protected readonly widgetEdite = signal<WidgetVue | null>(null);
  /** Valeurs choisies dans les listes de critères des cartes (état d'affichage, non enregistré). */
  protected readonly valeurs = signal<ValeursCriteres>({});

  /** Statut en lecture seule : une pastille du kit (Actif vert ; Inactif en bleu faute de gris : GAP-DS design_system_angular#29). */
  protected readonly couleursStatuts: Record<StatutTableauDeBord, TagColor> = { Actif: 'success', Inactif: 'information' };
  protected readonly optionsStatuts: LabsPillOption<StatutTableauDeBord>[] = [
    { value: 'Actif', label: 'Actif', color: 'green' },
    { value: 'Inactif', label: 'Inactif', color: 'gray' },
  ];
  protected readonly mode = computed(() => (this.edition() ? 'edit' : 'read'));
  protected readonly optionsPopulations = computed<LabsCompactFieldOption[]>(() => this.populations().map((p) => ({ value: p.id, label: p.nom })));
  /** Produits souscrits (plus celui du tableau, s'il ne l'est plus, pour ne pas perdre la valeur). */
  protected readonly optionsProduits = computed<LabsCompactFieldOption[]>(() => {
    const options = this.produits().map((p) => ({ value: p.id as string, label: p.libelle }));
    const actuel = this.brouillon()?.produit;
    return actuel && !options.some((o) => o.value === actuel) ? [...options, { value: actuel, label: actuel }] : options;
  });
  protected readonly populationNom = computed(() => this.populations().find((p) => p.id === this.brouillon()?.populationId)?.nom ?? '—');
  /**
   * Données simulées de la composition : périmètre de l'utilisateur connecté et filtres globaux par défaut (la population
   * adressée dit qui voit le tableau, pas quelles données il montre).
   */
  private readonly contexte = computed<ContexteWidgets>(() => ({
    employes: this.employes(),
    populations: this.populations(),
    workflows: this.workflows(),
    series: this.series(),
    valeurs: this.valeurs(),
  }));
  protected readonly sections = computed(() => {
    const t = this.brouillon();
    return t ? construireSections(t, this.indicateurs(), this.contexte()) : [];
  });
  protected readonly vues = computed(() => {
    const t = this.brouillon();
    return t ? construireWidgets(t, this.indicateurs(), this.contexte()) : [];
  });
  /** Prévisualisation : cartes KPI en haut, puis les graphes sur 2 colonnes. */
  protected readonly kpis = computed(() => this.vues().filter((v) => v.indicateur.typeGraphique === 'kpi'));
  protected readonly graphes = computed(() => this.vues().filter((v) => v.indicateur.typeGraphique !== 'kpi'));

  constructor() {
    const catalogue = inject(CatalogueService);
    forkJoin([
      this.service.getById(this.id),
      catalogue.getIndicateurs(),
      catalogue.getSeries(),
      catalogue.getCatalogue(),
      inject(PopulationsService).getAll(),
      catalogue.getWorkflows(),
      catalogue.getProduitsSouscrits(),
    ]).subscribe(
      ([tableau, indicateurs, series, sections, populations, workflows, produits]) => {
        if (!tableau) return this.retourListe();
        this.indicateurs.set(indicateurs);
        this.series.set(series);
        this.catalogue.set(sections);
        this.populations.set(populations);
        this.workflows.set(workflows);
        this.produits.set(produits);
        this.enregistreSurServeur.set(tableau);
        this.brouillon.set(structuredClone(tableau));
      },
    );
  }

  /** « Modifier » : passe en édition (le mode est dans l'URL). */
  protected modifier(): void {
    this.enregistre.set(false);
    this.router.navigate([], { relativeTo: this.route, queryParams: { mode: 'edition' }, queryParamsHandling: 'merge' });
  }

  protected enregistrer(): void {
    const t = this.brouillon();
    if (!t) return;
    this.service.enregistrerComposition(this.id, composition(t)).subscribe((enregistre) => {
      this.enregistreSurServeur.set(enregistre);
      this.enregistre.set(true);
    });
  }

  /** Ajout depuis la Bibliothèque ; une statistique générique demande d'abord son nom et son workflow. */
  protected ajouter(indicateur: IndicateurCatalogue): void {
    if (!indicateur.disponible) return;
    if (indicateur.generique) this.statistiqueAAjouter.set(indicateur);
    else this.modifierBrouillon((t) => ajouterWidget(t, indicateur));
  }

  protected ajouterStatistique(parametres: ParametresStatistique): void {
    const indicateur = this.statistiqueAAjouter();
    this.statistiqueAAjouter.set(null);
    if (indicateur) this.modifierBrouillon((t) => ajouterWidget(t, indicateur, parametres));
  }

  /** Dépôt d'un indicateur de la Bibliothèque dans la composition. */
  protected deposer(event: CdkDragDrop<unknown, unknown, string>): void {
    this.survol.set(false);
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

  /** Valeur choisie dans la liste d'un critère d'une carte : filtre cette carte (données fictives). */
  protected changerCritere(widgetId: string, { champ, valeur }: ChoixCritere): void {
    this.valeurs.update((v) => ({ ...v, [widgetId]: { ...v[widgetId], [champ]: valeur } }));
  }

  protected renommer(sectionId: string, libelle: string): void {
    this.modifierBrouillon((t) => renommerSection(t, sectionId, libelle));
  }

  protected changerStatut(statut: StatutTableauDeBord | null): void {
    if (statut) this.modifierBrouillon((t) => ({ ...t, statut }));
  }

  protected changerProduit(produit: string): void {
    if (produit) this.modifierBrouillon((t) => ({ ...t, produit: produit as TableauDeBord['produit'] }));
  }

  /** Libellé, description, population adressée : modifiables sur place dans le panneau « Informations ». */
  protected changerInfos(infos: Partial<Pick<TableauDeBord, 'libelle' | 'description' | 'populationId'>>): void {
    this.modifierBrouillon((t) => ({ ...t, ...infos }));
  }

  /** Clic sur une zone de dépôt : on amène l'utilisateur à la recherche de la Bibliothèque (dépliée si besoin). */
  protected chercherDansBibliotheque(): void {
    if (this.bibliothequeRepliee()) {
      this.bibliothequeRepliee.set(false);
      setTimeout(() => this.bibliotheque()?.focusRecherche());
    } else this.bibliotheque()?.focusRecherche();
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

/** Ce que « Enregistrer » persiste : sert aussi à détecter les changements non enregistrés. */
const composition = ({ libelle, description, produit, populationId, widgets, sections, statut }: TableauDeBord): Composition => ({
  libelle,
  description,
  produit,
  populationId,
  widgets,
  sections,
  statut,
});
