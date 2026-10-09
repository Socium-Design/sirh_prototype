import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  SocBadge,
  SocButton,
  SocButtonLeftIcon,
  SocDataTable,
  SocDataTableActions,
  SocDataTableBadge,
  SocDialog,
  SocMenu,
  SocMenuItem,
  SocMenuItemIcon,
  SocMessage,
  SocMessageContent,
  SocTooltip,
  SocTooltipLabel,
  type DataTableColumn,
  type DialogAction,
} from '@socium-design/angular-components';
import { LucidePencil, LucidePlus, LucideTrash } from '@lucide/angular';
import { forkJoin } from 'rxjs';
import { SessionService } from '../../../../../core/session/session.service';
import { extrait } from '../../../../../shared/utils/texte';
import type { Employe } from '../../employes/models/employe.model';
import { EmployesService } from '../../employes/services/employes.service';
import { PopulationImpactDialogComponent } from './components/population-impact-dialog.component';
import type { Population, PopulationUsage } from './models/population.model';
import { employesCouverts } from './services/population-regles';
import { PopulationsService } from './services/populations.service';

interface LignePopulation extends Population {
  nbEmployes: number;
  usages: PopulationUsage[];
  supprimable: boolean;
}

/**
 * Workspace > Configuration > onglet Populations — liste des populations (groupes d'employés servant de périmètre aux KPIs).
 * Contenu d'onglet : affiché dans la page Configuration, il n'a pas de template de page à lui.
 */
@Component({
  selector: 'app-populations-page',
  styles: `.populations__vide { display: block; margin-top: var(--bridges-position-gap-md); }`,
  imports: [
    SocBadge, SocButton, SocButtonLeftIcon, SocDataTable, SocDataTableBadge, SocDataTableActions,
    SocMenu, SocMenuItem, SocMenuItemIcon, SocTooltip, SocTooltipLabel, SocDialog, SocMessage, SocMessageContent,
    PopulationImpactDialogComponent, LucidePlus, LucidePencil, LucideTrash,
  ],
  template: `
    <ng-template #actionsMenu let-row let-close="close">
      <soc-menu>
        <button socMenuItem label="Modifier" (click)="close(); modifier(row)">
          <svg lucidePencil socMenuItemIcon class="size-full" [strokeWidth]="1.5"></svg>
        </button>
        @if (row.supprimable) {
          <button socMenuItem label="Supprimer" (click)="close(); demanderSuppression(row)">
            <svg lucideTrash socMenuItemIcon class="size-full" [strokeWidth]="1.5"></svg>
          </button>
        } @else {
          <soc-tooltip position="left">
            <button socMenuItem label="Supprimer" disabled>
              <svg lucideTrash socMenuItemIcon class="size-full" [strokeWidth]="1.5"></svg>
            </button>
            <span socTooltipLabel>Seule la personne qui l'a créée ({{ row.creePar.nom }}) peut supprimer cette population.</span>
          </soc-tooltip>
        }
      </soc-menu>
    </ng-template>

    <soc-data-table
      title="Populations"
      subtitle="Groupes d'employés définis par règles, réutilisables dans les dashboards et les modules."
      [columns]="columns"
      [rows]="pageRows()"
      [rowKey]="rowKey"
      [searchable]="true"
      (search)="onSearch($event)"
      [rowActionsMenu]="actionsMenu"
      [pagination]="pagination()"
      (pageChange)="page.set($event)"
      (pageSizeChange)="onPageSize($event)"
    >
      <soc-badge socDataTableBadge color="primary">{{ lignes().length }}</soc-badge>
      <button socButton socDataTableActions (click)="creer()">
        <svg lucidePlus socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
        Créer une population
      </button>
    </soc-data-table>
    @if (charge() && !filtered().length) {
      <soc-message class="populations__vide" variant="inline" status="info">
        <span socMessageContent>{{ query() ? 'Aucune population ne correspond à « ' + query() + ' ».' : 'Aucune population pour le moment.' }}</span>
      </soc-message>
    }

    <soc-dialog
      [open]="!!aConfirmer()"
      title="Supprimer la population"
      [primaryAction]="confirmerSuppression"
      [secondaryAction]="annulerSuppression"
      (close)="aConfirmer.set(null)"
    >
      <p>La population « {{ aConfirmer()?.nom }} » n'est utilisée par aucun élément. Elle sera définitivement supprimée.</p>
    </soc-dialog>

    @if (impact(); as ligne) {
      <app-population-impact-dialog
        [open]="true"
        mode="suppression"
        [populationNom]="ligne.nom"
        [usages]="ligne.usages"
        (confirm)="supprimer(ligne, $event)"
        (cancel)="impact.set(null)"
      />
    }
  `,
})
export class PopulationsPageComponent {
  private readonly router = inject(Router);
  private readonly service = inject(PopulationsService);
  private readonly session = inject(SessionService);
  private readonly employes = toSignal(inject(EmployesService).getAll(), { initialValue: [] as Employe[] });

  private readonly populations = signal<Population[]>([]);
  private readonly usages = signal<PopulationUsage[]>([]);
  protected readonly charge = signal(false);

  protected readonly rowKey = (p: LignePopulation) => p.id;
  protected readonly query = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly aConfirmer = signal<LignePopulation | null>(null);
  protected readonly impact = signal<LignePopulation | null>(null);

  protected readonly columns: DataTableColumn<LignePopulation>[] = [
    { key: 'nom', header: 'Nom', render: (p) => p.nom },
    { key: 'description', header: 'Description', render: (p) => extrait(p.description) },
    { key: 'regles', header: 'Règles', render: (p) => String(p.conditions.length) },
    { key: 'employes', header: 'Employés couverts', render: (p) => String(p.nbEmployes) },
    { key: 'usages', header: 'Utilisée par', render: (p) => (p.usages.length ? `${p.usages.length} élément${p.usages.length > 1 ? 's' : ''}` : '—') },
    { key: 'creePar', header: 'Créée par', render: (p) => p.creePar.nom },
    { key: 'modifieeLe', header: 'Modifiée le', render: (p) => new Date(p.modifieeLe).toLocaleDateString('fr-FR') },
  ];

  protected readonly lignes = computed<LignePopulation[]>(() => {
    const email = this.session.user().email;
    return this.populations().map((p) => ({
      ...p,
      nbEmployes: employesCouverts(p, this.employes()).length,
      usages: this.usages().filter((u) => u.populationId === p.id),
      supprimable: p.creePar.email === email,
    }));
  });

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q ? this.lignes().filter((p) => p.nom.toLowerCase().includes(q)) : this.lignes();
  });

  protected readonly pageRows = computed(() => this.filtered().slice((this.page() - 1) * this.pageSize(), this.page() * this.pageSize()));
  protected readonly pagination = computed(() => ({
    currentPage: this.page(),
    totalPages: Math.max(1, Math.ceil(this.filtered().length / this.pageSize())),
    totalEntries: this.filtered().length,
    pageSize: this.pageSize(),
  }));

  protected readonly confirmerSuppression: DialogAction = { label: 'Supprimer', onClick: () => this.supprimer(this.aConfirmer()!, []) };
  protected readonly annulerSuppression: DialogAction = { label: 'Annuler', onClick: () => this.aConfirmer.set(null) };

  constructor() {
    this.charger();
  }

  protected onSearch(query: string): void {
    this.query.set(query);
    this.page.set(1);
  }

  protected onPageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }

  protected creer(): void {
    this.router.navigate(['/workspace/configuration/populations/nouvelle']);
  }

  protected modifier(ligne: LignePopulation): void {
    this.router.navigate(['/workspace/configuration/populations', ligne.id, 'modifier']);
  }

  /** Utilisée quelque part → modale d'impact ; sinon simple confirmation. */
  protected demanderSuppression(ligne: LignePopulation): void {
    if (ligne.usages.length) this.impact.set(ligne);
    else this.aConfirmer.set(ligne);
  }

  protected supprimer(ligne: LignePopulation, usagesRetires: string[]): void {
    this.aConfirmer.set(null);
    this.impact.set(null);
    this.service.remove(ligne.id, usagesRetires).subscribe(() => this.charger());
  }

  private charger(): void {
    forkJoin([this.service.getAll(), this.service.getUsages()]).subscribe(([populations, usages]) => {
      this.populations.set(populations);
      this.usages.set(usages);
      this.charge.set(true);
    });
  }
}
