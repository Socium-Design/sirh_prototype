import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideEllipsis, LucidePencil, LucideRotateCcw } from '@lucide/angular';
import {
  SocBreadcrumb,
  SocButton,
  SocButtonLeftIcon,
  SocCardGrid,
  SocMenu,
  SocMenuItem,
  SocMenuItemIcon,
  SocMessage,
  SocMessageContent,
  SocMultiSelect,
  SocPageBreadcrumb,
  SocPageHome,
  SocPageSectionActions,
  SocPopover,
  SocPopoverTrigger,
  SocSelect,
  SocTooltip,
  SocTooltipLabel,
  type MessageAction,
  type MultiSelectOption,
  type SelectOption,
} from '@socium-design/angular-components';
import { forkJoin, map } from 'rxjs';
import { DATE_DONNEES } from '../../../../../mocks/data/employes.mock';
import { SessionService } from '../../../../core/session/session.service';
import type { Population } from '../configuration/populations/models/population.model';
import { PopulationsService } from '../configuration/populations/services/populations.service';
import type { Employe } from '../employes/models/employe.model';
import { EmployesService } from '../employes/services/employes.service';
import { WidgetCarteComponent } from './components/widget-carte.component';
import type { Indicateur, SerieIndicateur } from './models/indicateur.model';
import type { TableauDeBord } from './models/tableau-de-bord.model';
import type { WorkflowPersonnalise } from './models/workflow.model';
import { CatalogueService } from './services/catalogue.service';
import { sectionsConsultation } from './services/consultation';
import { DEFINITIONS_FILTRES_GLOBAUX, filtresGlobauxParDefaut, type CleFiltreGlobal, type FiltresGlobaux } from './services/filtres-globaux';
import { TableauxDeBordService } from './services/tableaux-de-bord.service';
import { construireWidgets } from './services/widgets';

const CONFIGURATION = '/workspace/configuration/tableaux-de-bord';

/**
 * Workspace > Tableau de bord — consultation.
 * - « Mon tableau de bord » : l'un des tableaux de bord accessibles à l'utilisateur (ceux dont la population adressée le
 *   contient), choisi dans un menu déroulant en haut de la page (pas d'onglets : leur nombre n'est pas limité). Le choix est
 *   porté par l'URL (`?tableau=<id>`), comme le bouton « Visualiser » de la Configuration ; un tableau hors de cette liste
 *   (inactif, autre population) s'affiche seul, sans menu.
 * - Filtres globaux (statut de l'employé, du compte, compte configuré, statut paie) appliqués à toutes les cartes ; par
 *   défaut les employés sortis et les comptes désactivés sont exclus. Un filtre de carte qui les contredit n'est pas
 *   appliqué (le global l'emporte) et la carte le signale.
 * Cartes en sections « Indicateurs clés » (KPI avec tendance), « Effectifs et mouvements », « Rémunération et absentéisme »,
 * « Workflows personnalisés ». Données : périmètre de l'utilisateur connecté (données fictives). Pas d'édition ici :
 * « Modifier » mène à la composition dans la Configuration.
 */
@Component({
  selector: 'app-tableau-de-bord-page',
  imports: [
    SocPageHome, SocPageBreadcrumb, SocPageSectionActions, SocBreadcrumb, SocSelect, SocMultiSelect, SocCardGrid, SocMessage, SocMessageContent, SocButton,
    SocButtonLeftIcon, SocTooltip, SocTooltipLabel, SocPopover, SocPopoverTrigger, SocMenu, SocMenuItem, SocMenuItemIcon, WidgetCarteComponent,
    LucideEllipsis, LucidePencil, LucideRotateCcw,
  ],
  styleUrl: './tableau-de-bord-page.component.scss',
  template: `
    <soc-page-home [sectionTitle]="titre()" [sectionSubtitle]="description()">
      <soc-breadcrumb socPageBreadcrumb [items]="[{ label: 'Workspace' }, { label: 'Tableau de bord' }]" />
      <div socPageSectionActions class="entete">
        @if (avecMenu() && optionsTableaux().length) {
          <soc-select
            class="entete__tableaux"
            mode="labelHeader"
            label="Tableau de bord"
            [options]="optionsTableaux()"
            [value]="tableau()?.id"
            (valueChange)="choisirTableau($event)"
            data-testid="tableaux"
          />
        }
      </div>

      <div class="consultation">
        @if (charge() && tableau()) {
          <section class="filtres" aria-label="Filtres globaux" data-testid="filtres-globaux">
            @for (filtre of definitionsFiltres; track filtre.cle) {
              <soc-multi-select
                class="filtres__champ"
                [label]="filtre.libelle"
                placeholder="Aucun"
                [options]="filtre.options"
                [value]="filtres()[filtre.cle]"
                (valueChange)="changerFiltre(filtre.cle, $event)"
                [attr.data-testid]="'filtre-' + filtre.cle"
              />
            }
            @if (filtresModifies()) {
              <button socButton variant="tertiary" class="filtres__reinitialiser" data-testid="reinitialiser" (click)="reinitialiserFiltres()">
                <svg lucideRotateCcw socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
                Réinitialiser
              </button>
            }
          </section>
        }
        @if (charge()) {
          @for (section of sections(); track section.id) {
            <section class="section" data-testid="section" [attr.aria-label]="section.libelle">
              <p class="section__titre">{{ section.libelle }}</p>
              <soc-card-grid [columns]="section.kpi ? 4 : 2">
                @for (vue of section.widgets; track vue.widget.id) {
                  <app-widget-carte [vue]="vue" [avecPied]="!!vue.indicateur.classifieNonHistorise || vue.filtresIgnores.length > 0" data-testid="widget">
                    <soc-popover appWidgetActions position="bottom-end" [open]="menuOuvert() === vue.widget.id" (openChange)="menuOuvert.set($event ? vue.widget.id : null)">
                      <soc-tooltip socPopoverTrigger>
                        <button socButton variant="ghost" [attr.aria-label]="'Actions du graphe ' + vue.titre">
                          <svg lucideEllipsis socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
                        </button>
                        <span socTooltipLabel>Actions</span>
                      </soc-tooltip>
                      <soc-menu>
                        <button socMenuItem label="Modifier" (click)="modifier()">
                          <svg lucidePencil socMenuItemIcon class="size-full" [strokeWidth]="1.5"></svg>
                        </button>
                      </soc-menu>
                    </soc-popover>
                    <div appWidgetPied class="widget__pied">
                      @if (vue.filtresIgnores.length) {
                        <soc-message variant="inline" status="info" data-testid="filtre-ignore">
                          <span socMessageContent>Filtre {{ vue.filtresIgnores.join(', ') }} non appliqué : les filtres globaux l'emportent.</span>
                        </soc-message>
                      }
                      @if (vue.indicateur.classifieNonHistorise) {
                        <soc-message variant="inline" status="warning" data-testid="classifie">
                          <span socMessageContent>Données classifiées sans historisation — affichage temps réel uniquement.</span>
                        </soc-message>
                      }
                    </div>
                  </app-widget-carte>
                }
              </soc-card-grid>
            </section>
          } @empty {
            @if (tableau()) {
              <soc-message variant="banner" status="info" title="Votre tableau de bord est vide" [primaryAction]="configurer" data-testid="vide">
                <span socMessageContent>Aucun graphe n'est encore affiché dans ce tableau de bord.</span>
              </soc-message>
            } @else {
              <soc-message variant="banner" status="info" title="Aucun tableau de bord" [primaryAction]="configurer" data-testid="vide">
                <span socMessageContent>Aucun tableau de bord actif ne vous est adressé pour l'instant.</span>
              </soc-message>
            }
          }
        }
      </div>
    </soc-page-home>
  `,
})
export class TableauDeBordPageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(SessionService);

  private readonly tableaux = signal<TableauDeBord[]>([]);
  /** Tableaux de bord accessibles à l'utilisateur sur Workspace, dans l'ordre du menu. */
  private readonly accessibles = signal<TableauDeBord[]>([]);
  private readonly populations = signal<Population[]>([]);
  private readonly indicateurs = signal<Indicateur[]>([]);
  private readonly series = signal<SerieIndicateur[]>([]);
  private readonly employes = signal<Employe[]>([]);
  private readonly workflows = signal<WorkflowPersonnalise[]>([]);
  protected readonly charge = signal(false);
  protected readonly menuOuvert = signal<string | null>(null);

  protected readonly filtres = signal<FiltresGlobaux>(filtresGlobauxParDefaut());
  protected readonly definitionsFiltres = DEFINITIONS_FILTRES_GLOBAUX.map((d) => ({
    ...d,
    options: d.valeurs.map((v): MultiSelectOption => ({ value: v, label: v })),
  }));
  protected readonly filtresModifies = computed(() => JSON.stringify(this.filtres()) !== JSON.stringify(filtresGlobauxParDefaut()));

  /** Tableau demandé par l'URL (`?tableau=`, menu déroulant ou bouton « Visualiser ») ; sinon le premier accessible. */
  protected readonly tableauDemande = toSignal(this.route.queryParamMap.pipe(map((q) => q.get('tableau'))), {
    initialValue: this.route.snapshot.queryParamMap.get('tableau'),
  });

  protected readonly tableau = computed(() => {
    const id = this.tableauDemande() ?? this.accessibles()[0]?.id;
    return this.tableaux().find((t) => t.id === id);
  });
  /** Le menu déroulant s'affiche pour un tableau accessible ; un autre tableau (« Visualiser ») s'affiche seul. */
  protected readonly avecMenu = computed(() => {
    const id = this.tableauDemande();
    return !id || this.accessibles().some((t) => t.id === id);
  });
  protected readonly optionsTableaux = computed<SelectOption[]>(() => this.accessibles().map((t) => ({ value: t.id, label: t.libelle })));
  protected readonly titre = computed(() => (this.avecMenu() ? 'Mon tableau de bord' : (this.tableau()?.libelle ?? 'Tableau de bord')));
  protected readonly description = computed(() => {
    const t = this.tableau();
    const entreprise = this.session.enterprises().find((e) => e.value === this.session.enterprise())?.company ?? '—';
    const population = this.populations().find((p) => p.id === t?.populationId)?.nom ?? '—';
    return `Population adressée : ${population} · Données de votre périmètre (${entreprise}) au ${new Date(DATE_DONNEES).toLocaleDateString('fr-FR')}`;
  });

  protected readonly sections = computed(() => {
    const t = this.tableau();
    if (!t) return [];
    const ctx = { employes: this.employes(), populations: this.populations(), workflows: this.workflows(), series: this.series(), filtresGlobaux: this.filtres() };
    return sectionsConsultation(construireWidgets(t, this.indicateurs(), ctx));
  });

  /** État vide : vers la composition du tableau s'il existe, sinon vers la gestion des tableaux de bord. */
  protected readonly configurer: MessageAction = { label: 'Configurer le tableau de bord', onClick: () => this.modifier() };

  constructor() {
    const catalogue = inject(CatalogueService);
    const service = inject(TableauxDeBordService);
    forkJoin([
      service.getAll(),
      service.getAccessibles('workspace'),
      inject(PopulationsService).getAll(),
      catalogue.getIndicateurs(),
      catalogue.getSeries(),
      inject(EmployesService).getAll(),
      catalogue.getWorkflows(),
    ]).subscribe(([tableaux, accessibles, populations, indicateurs, series, employes, workflows]) => {
      this.tableaux.set(tableaux);
      this.accessibles.set(accessibles);
      this.populations.set(populations);
      this.indicateurs.set(indicateurs);
      this.series.set(series);
      this.employes.set(employes);
      this.workflows.set(workflows);
      this.charge.set(true);
    });
  }

  protected choisirTableau(id: string | undefined): void {
    if (id && id !== this.tableau()?.id) this.router.navigate([], { relativeTo: this.route, queryParams: { tableau: id } });
  }

  protected changerFiltre(cle: CleFiltreGlobal, valeurs: string[]): void {
    this.filtres.update((f) => ({ ...f, [cle]: [...valeurs] }));
  }

  protected reinitialiserFiltres(): void {
    this.filtres.set(filtresGlobauxParDefaut());
  }

  /** Pas d'édition sur la consultation : on part vers la composition, dans la Configuration. */
  protected modifier(): void {
    this.menuOuvert.set(null);
    const t = this.tableau();
    if (t) this.router.navigate([CONFIGURATION, t.id], { queryParams: { mode: 'edition' } });
    else this.router.navigateByUrl(CONFIGURATION);
  }
}
