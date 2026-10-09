import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideEllipsis, LucideEye, LucideEyeOff, LucideFileDown, LucidePencil } from '@lucide/angular';
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
import { LIBELLES_ROLES, SessionService, type RoleDemo } from '../../../../core/session/session.service';
import type { Population } from '../configuration/populations/models/population.model';
import { PopulationsService } from '../configuration/populations/services/populations.service';
import type { Employe } from '../employes/models/employe.model';
import { EmployesService } from '../employes/services/employes.service';
import { WidgetCarteComponent } from './components/widget-carte.component';
import type { Indicateur, SerieIndicateur } from './models/indicateur.model';
import type { TableauDeBord } from './models/tableau-de-bord.model';
import { CatalogueService } from './services/catalogue.service';
import { employesDuPerimetre, tableauxAccessibles } from './services/consultation';
import { TableauxDeBordService } from './services/tableaux-de-bord.service';
import { construireSections, type WidgetVue } from './services/widgets';
import { WidgetsMasquesService } from './services/widgets-masques.service';

/**
 * Workspace > Tableau de bord — consultation. Cartes segmentées par section, vrai graphique par widget, masquage par
 * l'icône œil (jusqu'à « 0 KPI »), vue par rôle (démo) et par filiale (bascule du header, vue consolidée comprise).
 * Pas d'édition ici : « Modifier » mène à la composition dans la Configuration (un tableau est partagé par sa population).
 */
@Component({
  selector: 'app-tableau-de-bord-page',
  imports: [
    SocPageHome, SocPageBreadcrumb, SocPageSectionActions, SocBreadcrumb, SocSelect, SocCardGrid, SocTag, SocMessage, SocMessageContent,
    SocButton, SocButtonLeftIcon, SocTooltip, SocTooltipLabel, SocPopover, SocPopoverTrigger, SocMenu, SocMenuItem, SocMenuItemIcon,
    WidgetCarteComponent, LucideEye, LucideEyeOff, LucideEllipsis, LucidePencil, LucideFileDown,
  ],
  styleUrl: './tableau-de-bord-page.component.scss',
  template: `
    <soc-page-home [sectionTitle]="tableau()?.libelle ?? 'Tableau de bord'" [sectionSubtitle]="tableau()?.description">
      <soc-breadcrumb socPageBreadcrumb [items]="[{ label: 'Workspace' }, { label: 'Tableau de bord' }]" />
      <div socPageSectionActions class="filtres">
        <soc-select mode="labelHeader" label="Vue (démo)" [options]="optionsRoles" [value]="session.role()" (valueChange)="changerRole($event)" />
        @if (accessibles().length) {
          <soc-select mode="labelHeader" label="Tableau de bord" [options]="optionsTableaux()" [value]="tableau()?.id" (valueChange)="choisir($event)" />
        }
      </div>

      <div class="consultation">
        @if (message()) {
          <soc-message variant="inline" status="success">
            <span socMessageContent data-testid="message">{{ message() }}</span>
          </soc-message>
        }

        @if (!charge()) {
          <!-- chargement -->
        } @else if (!tableau()) {
          <soc-message variant="banner" status="info" title="Aucun tableau de bord" data-testid="aucun-tableau">
            <span socMessageContent>Aucun tableau de bord actif n'est accessible en tant que {{ libelleRole() }} : l'accès dépend de la population de chaque tableau.</span>
          </soc-message>
        } @else {
          <div class="perimetre" data-testid="perimetre">
            <soc-tag color="purple">{{ session.filiale() ?? 'Vue consolidée' }}</soc-tag>
            <span class="perimetre__aide">{{ perimetre().length }} employé(s) dans le périmètre · changez de filiale ou passez en vue consolidée depuis le sélecteur d'entreprise du bandeau.</span>
          </div>

          @for (section of sections(); track section.id) {
            <section class="section" data-testid="section" [attr.aria-label]="section.libelle">
              <p class="section__titre">{{ section.libelle }}</p>
              <soc-card-grid [columns]="3">
                @for (vue of section.widgets; track vue.widget.id) {
                  <app-widget-carte [vue]="vue" data-testid="widget">
                    <soc-tooltip appWidgetActions>
                      <button socButton variant="ghost" [attr.aria-label]="'Masquer le widget ' + vue.titre" (click)="basculer(vue)">
                        <svg lucideEye socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
                      </button>
                      <span socTooltipLabel>Masquer ce widget (vous pourrez le réafficher plus bas)</span>
                    </soc-tooltip>
                    <soc-popover appWidgetActions position="bottom-end" [open]="menuOuvert() === vue.widget.id" (openChange)="menuOuvert.set($event ? vue.widget.id : null)">
                      <soc-tooltip socPopoverTrigger>
                        <button socButton variant="ghost" [attr.aria-label]="'Actions du widget ' + vue.titre">
                          <svg lucideEllipsis socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
                        </button>
                        <span socTooltipLabel>Actions</span>
                      </soc-tooltip>
                      <soc-menu>
                        @if (adminRh()) {
                          <button socMenuItem label="Modifier" (click)="modifier()">
                            <svg lucidePencil socMenuItemIcon class="size-full" [strokeWidth]="1.5"></svg>
                          </button>
                        }
                        <button socMenuItem label="Exporter en PDF" (click)="exporter(vue)">
                          <svg lucideFileDown socMenuItemIcon class="size-full" [strokeWidth]="1.5"></svg>
                        </button>
                      </soc-menu>
                    </soc-popover>
                  </app-widget-carte>
                }
              </soc-card-grid>
            </section>
          } @empty {
            <soc-message variant="banner" status="info" title="Aucun widget affiché" data-testid="zero-kpi" [primaryAction]="masques().length ? toutAfficherAction : undefined">
              <span socMessageContent>{{ masques().length ? 'Vous avez masqué tous les widgets de ce tableau de bord.' : 'Ce tableau de bord ne contient encore aucun widget.' }}</span>
            </soc-message>
          }

          @if (masques().length) {
            <section class="masques" data-testid="masques" aria-label="Widgets masqués">
              <p class="section__titre">Widgets masqués ({{ masques().length }})</p>
              @for (vue of masques(); track vue.widget.id) {
                <div class="masques__ligne" data-testid="widget-masque">
                  <soc-tooltip>
                    <button socButton variant="ghost" [attr.aria-label]="'Afficher le widget ' + vue.titre" (click)="basculer(vue)">
                      <svg lucideEyeOff socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
                    </button>
                    <span socTooltipLabel>Afficher ce widget</span>
                  </soc-tooltip>
                  <span>{{ vue.titre }}</span>
                  @for (filtre of vue.filtres; track filtre.valeur) {
                    <soc-tag color="information">{{ filtre.libelle }}</soc-tag>
                  }
                </div>
              }
            </section>
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
  private readonly masquesService = inject(WidgetsMasquesService);

  private readonly tableaux = signal<TableauDeBord[]>([]);
  private readonly populations = signal<Population[]>([]);
  private readonly indicateurs = signal<Indicateur[]>([]);
  private readonly series = signal<SerieIndicateur[]>([]);
  private readonly employes = signal<Employe[]>([]);
  protected readonly charge = signal(false);
  protected readonly menuOuvert = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);

  /** Tableau choisi : porté par l'URL (`?tableau=`), sinon le premier accessible. */
  private readonly tableauDemande = toSignal(this.route.queryParamMap.pipe(map((q) => q.get('tableau'))), {
    initialValue: this.route.snapshot.queryParamMap.get('tableau'),
  });

  protected readonly optionsRoles: SelectOption[] = Object.entries(LIBELLES_ROLES).map(([value, label]) => ({ value, label }));
  protected readonly adminRh = computed(() => this.session.role() === 'admin-rh');
  protected readonly libelleRole = computed(() => LIBELLES_ROLES[this.session.role()]);

  /** L'utilisateur connecté, parmi les employés (pour savoir quelles populations le couvrent). */
  private readonly utilisateur = computed(() => this.employes().find((e) => e.email === this.session.user().email));
  protected readonly accessibles = computed(() =>
    tableauxAccessibles(this.tableaux(), this.populations(), this.session.role(), this.utilisateur(), this.employes()),
  );
  protected readonly optionsTableaux = computed<SelectOption[]>(() => this.accessibles().map((t) => ({ value: t.id, label: t.libelle })));
  protected readonly tableau = computed(() => this.accessibles().find((t) => t.id === this.tableauDemande()) ?? this.accessibles()[0]);

  protected readonly perimetre = computed(() => employesDuPerimetre(this.employes(), this.session.filiale()));
  private readonly idsMasques = computed(() => (this.tableau() ? this.masquesService.pour(this.tableau()!.id) : []));
  private readonly toutesSections = computed(() => {
    const t = this.tableau();
    return t ? construireSections(t, this.indicateurs(), this.perimetre(), this.series()) : [];
  });
  /** Sections affichées : sans les widgets masqués, et sans section vide. */
  protected readonly sections = computed(() =>
    this.toutesSections()
      .map((s) => ({ ...s, widgets: s.widgets.filter((w) => !this.idsMasques().includes(w.widget.id)) }))
      .filter((s) => s.widgets.length),
  );
  protected readonly masques = computed(() => this.toutesSections().flatMap((s) => s.widgets).filter((w) => this.idsMasques().includes(w.widget.id)));

  protected readonly toutAfficherAction: MessageAction = { label: 'Tout réafficher', onClick: () => this.masquesService.toutAfficher(this.tableau()!.id) };

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
    this.message.set(null);
  }

  protected choisir(id: string | undefined): void {
    this.message.set(null);
    this.router.navigate([], { relativeTo: this.route, queryParams: { tableau: id ?? null }, queryParamsHandling: 'merge' });
  }

  protected basculer(vue: WidgetVue): void {
    this.masquesService.basculer(this.tableau()!.id, vue.widget.id);
  }

  /** Pas d'édition sur le tableau partagé : on part vers sa composition, dans la Configuration. */
  protected modifier(): void {
    this.menuOuvert.set(null);
    this.router.navigate(['/workspace/configuration/tableaux-de-bord', this.tableau()!.id], { queryParams: { mode: 'edition' } });
  }

  /** Export PDF simulé (pas de toast dans le kit : GAP-DS #12). */
  protected exporter(vue: WidgetVue): void {
    this.menuOuvert.set(null);
    this.message.set(`Export PDF du widget « ${vue.titre} » lancé (simulation).`);
  }
}
