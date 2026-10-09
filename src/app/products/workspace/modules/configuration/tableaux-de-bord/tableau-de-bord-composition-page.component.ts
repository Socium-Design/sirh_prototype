import { CdkDropList, CdkDropListGroup, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideArrowLeft, LucideCheck, LucideEllipsis, LucideEye, LucideFilter, LucidePencil, LucideSave, LucideTrash } from '@lucide/angular';
import {
  SocBadge,
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
import { type StatutTableauDeBord, type TableauDeBord } from '../../tableau-de-bord/models/tableau-de-bord.model';
import type { IndicateurCatalogue, SectionAvecIndicateurs } from '../../tableau-de-bord/services/catalogue';
import { CatalogueService } from '../../tableau-de-bord/services/catalogue.service';
import { ajouterWidget, modifierWidget, renommerSection, retirerWidget } from '../../tableau-de-bord/services/composition';
import { TableauxDeBordService, type Composition } from '../../tableau-de-bord/services/tableaux-de-bord.service';
import { construireSections, construireWidgets, employesDuTableau, type WidgetVue } from '../../tableau-de-bord/services/widgets';
import type { Population } from '../populations/models/population.model';
import { PopulationsService } from '../populations/services/populations.service';
import { BibliothequeComponent } from './components/bibliotheque.component';
import { ProfilsComponent } from './components/pastilles.component';
import { WidgetDialogComponent, type ModificationWidget } from './components/widget-dialog.component';
import type { AvecChangementsNonEnregistres } from './quitter-sans-enregistrer.guard';

const LISTE = '/workspace/configuration/tableaux-de-bord';

/**
 * Workspace > Configuration > Gestion des tableaux de bord > composition d'un tableau de bord (GabaritComposerPage du Figma Make).
 * Espace de travail `soc-labs-workspace-layout` : barre du haut (retour, nom, « Lecture seule » ou indication, actions),
 * panneau « Informations » à gauche, composition au centre, Bibliothèque à droite (édition) ; chaque colonne défile seule.
 * - « Détail » (par défaut) : lecture seule.
 * - `?mode=edition` (« Modifier ») : informations et statut modifiables (profils en lecture seule, comme dans le Figma), ajout depuis la Bibliothèque par « + » ou
 *   glisser-déposer, « Modifier le KPI » ; les changements portent sur un brouillon enregistré par « Enregistrer » (→ « Enregistré ✓ »).
 * - « Prévisualiser » : le tableau en plein écran (`soc-labs-fullscreen-overlay`), sur données simulées.
 * Composants Labs (expérimentaux) : importés via `shared/labs/labs.ts`.
 */
@Component({
  selector: 'app-tableau-de-bord-composition-page',
  host: { '(window:beforeunload)': 'avertirAvantDechargement($event)' },
  imports: [
    CdkDropListGroup, CdkDropList, SocBadge, SocTag, SocButton, SocButtonLeftIcon, SocButtonRightIcon, SocCardGrid, SocPopover, SocPopoverTrigger, SocMenu, SocMenuItem,
    SocMenuItemIcon, SocMessage, SocMessageContent, SocDialog, SocLabsWorkspaceLayout, SocLabsWorkspaceBack, SocLabsWorkspaceTitle,
    SocLabsWorkspaceHint, SocLabsWorkspaceActions, SocLabsWorkspaceLeft, SocLabsWorkspaceRight, SocLabsCompactField, SocLabsPillToggle,
    SocLabsIconButton, SocLabsDropZone, SocLabsFullscreenOverlay, SocLabsOverlayBadge, WidgetCarteComponent, BibliothequeComponent,
    WidgetDialogComponent, ProfilsComponent, LucideArrowLeft, LucideEye, LucidePencil, LucideSave, LucideCheck, LucideEllipsis, LucideTrash,
    LucideFilter,
  ],
  styleUrl: './tableau-de-bord-composition-page.component.scss',
  template: `
    @if (brouillon(); as t) {
      <soc-labs-workspace-layout leftWidth="240px" rightWidth="280px" cdkDropListGroup>
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
          <button socButton variant="secondary" data-testid="previsualiser" (click)="apercu.set(true)">
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
            <button socButton data-testid="enregistrer" [disabled]="!t.libelle.trim()" (click)="enregistrer()">
              <svg lucideSave socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
              Enregistrer
            </button>
          }
        </div>

        <div socLabsWorkspaceLeft class="infos" data-testid="infos">
          <p class="infos__titre">INFORMATIONS</p>
          <soc-labs-compact-field label="Libellé" [mode]="mode()" [value]="t.libelle" (valueChange)="changerInfos({ libelle: $event })" data-testid="libelle" />
          <soc-labs-compact-field
            label="Description"
            control="textarea"
            [mode]="mode()"
            [value]="t.description"
            (valueChange)="changerInfos({ description: $event })"
            data-testid="description"
          />
          <soc-labs-compact-field
            label="Population"
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
          <div class="infos__champ" role="group" aria-labelledby="profils-libelle">
            <span class="infos__libelle" id="profils-libelle">Profils</span>
            <app-profils [profils]="t.profils" data-testid="profils" />
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
                <soc-badge color="primary">{{ section.widgets.length }} KPI</soc-badge>
              </div>
              <soc-card-grid [columns]="3">
                @for (vue of section.widgets; track vue.widget.id) {
                  <app-widget-carte [vue]="vue" [compact]="true" [pastille]="true" [descriptionDeuxLignes]="true" data-testid="widget">
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
                    <div appWidgetPied class="widget__filtres" data-testid="filtres">
                      <svg lucideFilter class="widget__filtre-icone" [strokeWidth]="1.5" aria-hidden="true"></svg>
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
        }
      </soc-labs-fullscreen-overlay>

      <app-widget-dialog [vue]="widgetEdite()" [sections]="t.sections" [employes]="employes()" (enregistre)="sauverWidget($event)" (annule)="widgetEdite.set(null)" />

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
  /** Un graphe de la Bibliothèque est glissé au-dessus de la composition. */
  protected readonly survol = signal(false);
  private readonly bibliotheque = viewChild(BibliothequeComponent);
  protected readonly menuOuvert = signal<string | null>(null);
  protected readonly widgetEdite = signal<WidgetVue | null>(null);

  /** Statut en lecture seule : une pastille du kit (Actif vert, Archivé ambre ; Inactif en bleu faute de gris : GAP-DS design_system_angular#29). */
  protected readonly couleursStatuts: Record<StatutTableauDeBord, TagColor> = { Actif: 'success', Inactif: 'information', Archivé: 'warning' };
  protected readonly optionsStatuts: LabsPillOption<StatutTableauDeBord>[] = [
    { value: 'Actif', label: 'Actif', color: 'green' },
    { value: 'Inactif', label: 'Inactif', color: 'gray' },
    { value: 'Archivé', label: 'Archivé', color: 'amber' },
  ];
  protected readonly mode = computed(() => (this.edition() ? 'edit' : 'read'));
  protected readonly optionsPopulations = computed<LabsCompactFieldOption[]>(() => this.populations().map((p) => ({ value: p.id, label: p.nom })));
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

  protected ajouter(indicateur: IndicateurCatalogue): void {
    if (indicateur.disponible) this.modifierBrouillon((t) => ajouterWidget(t, indicateur));
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

  protected renommer(sectionId: string, libelle: string): void {
    this.modifierBrouillon((t) => renommerSection(t, sectionId, libelle));
  }

  protected changerStatut(statut: StatutTableauDeBord | null): void {
    if (statut) this.modifierBrouillon((t) => ({ ...t, statut }));
  }

  /** Libellé, description, population : modifiables sur place dans le panneau « Informations ». */
  protected changerInfos(infos: Partial<Pick<TableauDeBord, 'libelle' | 'description' | 'populationId'>>): void {
    this.modifierBrouillon((t) => ({ ...t, ...infos }));
  }

  /** Clic sur une zone de dépôt : on amène l'utilisateur à la recherche de la Bibliothèque. */
  protected chercherDansBibliotheque(): void {
    this.bibliotheque()?.focusRecherche();
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
const composition = ({ libelle, description, populationId, widgets, sections, statut, profils }: TableauDeBord): Composition => ({
  libelle,
  description,
  populationId,
  widgets,
  sections,
  statut,
  profils,
});
