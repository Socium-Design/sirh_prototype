import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideEllipsis, LucidePencil } from '@lucide/angular';
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
  SocPageBreadcrumb,
  SocPageHome,
  SocPageSectionActions,
  SocPopover,
  SocPopoverTrigger,
  SocSelect,
  SocTag,
  SocTooltip,
  SocTooltipLabel,
  type MessageAction,
  type SelectOption,
} from '@socium-design/angular-components';
import { forkJoin, map } from 'rxjs';
import { DATE_DONNEES } from '../../../../../mocks/data/employes.mock';
import { LIBELLES_ROLES, SessionService, type RoleDemo } from '../../../../core/session/session.service';
import type { Population } from '../configuration/populations/models/population.model';
import { PopulationsService } from '../configuration/populations/services/populations.service';
import type { Employe } from '../employes/models/employe.model';
import { EmployesService } from '../employes/services/employes.service';
import { WidgetCarteComponent } from './components/widget-carte.component';
import type { Indicateur, SerieIndicateur } from './models/indicateur.model';
import type { TableauDeBord } from './models/tableau-de-bord.model';
import { CatalogueService } from './services/catalogue.service';
import { sectionsConsultation, tableauDuRole } from './services/consultation';
import { TableauxDeBordService } from './services/tableaux-de-bord.service';
import { construireWidgets, employesDuTableau } from './services/widgets';

const CONFIGURATION = '/workspace/configuration/tableaux-de-bord';
/** Étiquette du rôle à côté du titre. */
const ETIQUETTES_ROLES: Record<RoleDemo, string> = { 'admin-rh': 'RH', manager: 'Manager', 'direction-generale': 'DG' };

/**
 * Workspace > Tableau de bord — consultation.
 * - « Mon tableau de bord » : le tableau actif ouvert au rôle choisi (filtre « Rôle », démo), en sections « Indicateurs clés »
 *   (cartes KPI avec tendance), « Effectifs et mouvements », « Rémunération et absentéisme ».
 * - `?tableau=<id>` (bouton « Visualiser » de la Configuration) : ce tableau-là.
 * Données calculées sur la population du tableau. Pas d'édition ici : « Modifier » mène à la composition dans la Configuration.
 */
@Component({
  selector: 'app-tableau-de-bord-page',
  imports: [
    SocPageHome, SocPageBreadcrumb, SocPageSectionActions, SocBreadcrumb, SocSelect, SocCardGrid, SocTag, SocMessage, SocMessageContent, SocButton,
    SocButtonLeftIcon, SocTooltip, SocTooltipLabel, SocPopover, SocPopoverTrigger, SocMenu, SocMenuItem, SocMenuItemIcon, WidgetCarteComponent,
    LucideEllipsis, LucidePencil,
  ],
  styleUrl: './tableau-de-bord-page.component.scss',
  template: `
    <soc-page-home [sectionTitle]="titre()" [sectionSubtitle]="description()">
      <soc-breadcrumb socPageBreadcrumb [items]="[{ label: 'Workspace' }, { label: 'Tableau de bord' }]" />
      <div socPageSectionActions class="entete">
        @if (!tableauDemande()) {
          <soc-tag color="purple" data-testid="role">{{ etiquetteRole() }}</soc-tag>
          <soc-select mode="labelHeader" label="Rôle" [options]="optionsRoles" [value]="session.role()" (valueChange)="changerRole($event)" />
        }
      </div>

      <div class="consultation">
        @if (charge()) {
          @for (section of sections(); track section.id) {
            <section class="section" data-testid="section" [attr.aria-label]="section.libelle">
              <p class="section__titre">{{ section.libelle }}</p>
              <soc-card-grid [columns]="section.kpi ? 4 : 2">
                @for (vue of section.widgets; track vue.widget.id) {
                  <app-widget-carte [vue]="vue" [avecPied]="!!vue.indicateur.classifieNonHistorise" data-testid="widget">
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
                    <soc-message appWidgetPied variant="inline" status="warning" data-testid="classifie">
                      <span socMessageContent>Données classifiées sans historisation — affichage temps réel uniquement.</span>
                    </soc-message>
                  </app-widget-carte>
                }
              </soc-card-grid>
            </section>
          } @empty {
            <soc-message variant="banner" status="info" title="Votre tableau de bord est vide" [primaryAction]="configurer" data-testid="vide">
              <span socMessageContent>Aucun graphe n'est encore affiché pour ce profil.</span>
            </soc-message>
          }
        }
      </div>
    </soc-page-home>
  `,
})
export class TableauDeBordPageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly session = inject(SessionService);

  private readonly tableaux = signal<TableauDeBord[]>([]);
  private readonly populations = signal<Population[]>([]);
  private readonly indicateurs = signal<Indicateur[]>([]);
  private readonly series = signal<SerieIndicateur[]>([]);
  private readonly employes = signal<Employe[]>([]);
  protected readonly charge = signal(false);
  protected readonly menuOuvert = signal<string | null>(null);

  /** Tableau demandé par l'URL (`?tableau=`, bouton « Visualiser ») ; sinon celui du rôle. */
  protected readonly tableauDemande = toSignal(this.route.queryParamMap.pipe(map((q) => q.get('tableau'))), {
    initialValue: this.route.snapshot.queryParamMap.get('tableau'),
  });

  protected readonly optionsRoles: SelectOption[] = Object.entries(LIBELLES_ROLES).map(([value, label]) => ({ value, label }));
  protected readonly etiquetteRole = computed(() => ETIQUETTES_ROLES[this.session.role()]);

  protected readonly tableau = computed(() => {
    const id = this.tableauDemande();
    return id ? this.tableaux().find((t) => t.id === id) : tableauDuRole(this.tableaux(), this.session.role());
  });
  protected readonly titre = computed(() => (this.tableauDemande() ? (this.tableau()?.libelle ?? 'Tableau de bord') : 'Mon tableau de bord'));
  protected readonly description = computed(() => {
    const t = this.tableau();
    const entreprise = this.session.enterprises().find((e) => e.value === this.session.enterprise())?.company ?? '—';
    const population = this.populations().find((p) => p.id === t?.populationId)?.nom ?? '—';
    return `Périmètre : ${entreprise} · Population : ${population} · Données au ${new Date(DATE_DONNEES).toLocaleDateString('fr-FR')}`;
  });

  protected readonly sections = computed(() => {
    const t = this.tableau();
    if (!t) return [];
    const perimetre = employesDuTableau(t, this.populations(), this.employes());
    return sectionsConsultation(construireWidgets(t, this.indicateurs(), perimetre, this.series()));
  });

  /** État vide : vers la composition du tableau s'il existe, sinon vers la gestion des tableaux de bord. */
  protected readonly configurer: MessageAction = { label: 'Configurer le tableau de bord', onClick: () => this.modifier() };

  constructor() {
    const catalogue = inject(CatalogueService);
    forkJoin([
      inject(TableauxDeBordService).getAll(),
      inject(PopulationsService).getAll(),
      catalogue.getIndicateurs(),
      catalogue.getSeries(),
      inject(EmployesService).getAll(),
    ]).subscribe(([tableaux, populations, indicateurs, series, employes]) => {
      this.tableaux.set(tableaux);
      this.populations.set(populations);
      this.indicateurs.set(indicateurs);
      this.series.set(series);
      this.employes.set(employes);
      this.charge.set(true);
    });
  }

  protected changerRole(role: string | undefined): void {
    if (role) this.session.role.set(role as RoleDemo);
  }

  /** Pas d'édition sur la consultation : on part vers la composition, dans la Configuration. */
  protected modifier(): void {
    this.menuOuvert.set(null);
    const t = this.tableau();
    if (t) this.router.navigate([CONFIGURATION, t.id], { queryParams: { mode: 'edition' } });
    else this.router.navigateByUrl(CONFIGURATION);
  }
}
