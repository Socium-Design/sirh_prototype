import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import {
  SocBadge,
  SocDataTable,
  SocDataTableBadge,
  SocMenu,
  SocMenuItem,
  SocMessage,
  SocMessageContent,
  SocTag,
  SocTooltip,
  SocTooltipLabel,
  type DataTableCellContext,
  type DataTableColumn,
  type TagColor,
} from '@socium-design/angular-components';
import { forkJoin } from 'rxjs';
import { extrait } from '../../../../../shared/utils/texte';
import type { StatutTableauDeBord, TableauDeBord } from '../../tableau-de-bord/models/tableau-de-bord.model';
import { TableauxDeBordService, peutEtreActive } from '../../tableau-de-bord/services/tableaux-de-bord.service';
import { PopulationsService } from '../populations/services/populations.service';

interface LigneTableau extends TableauDeBord {
  populationNom: string;
  activable: boolean;
}

const COULEURS_STATUT: Record<StatutTableauDeBord, TagColor> = { Actif: 'success', Inactif: 'information', Archivé: 'warning' };

/**
 * Workspace > Configuration > onglet Gestion des tableaux de bord — liste des tableaux de bord du client.
 * Contenu d'onglet : affiché dans la page Configuration, il n'a pas de template de page à lui.
 */
@Component({
  selector: 'app-tableaux-de-bord-page',
  imports: [SocDataTable, SocDataTableBadge, SocBadge, SocTag, SocMenu, SocMenuItem, SocTooltip, SocTooltipLabel, SocMessage, SocMessageContent],
  styles: `.tableaux__vide { display: block; margin-top: var(--bridges-position-gap-md); }`,
  template: `
    <ng-template #statutCell let-row>
      <soc-tag [color]="couleur(row.statut)">{{ row.statut }}</soc-tag>
    </ng-template>

    <ng-template #actionsMenu let-row let-close="close">
      <soc-menu>
        @if (row.statut === 'Actif') {
          <button socMenuItem label="Désactiver" (click)="close(); changerStatut(row, 'Inactif')"></button>
        } @else if (row.activable) {
          <button socMenuItem label="Activer" (click)="close(); changerStatut(row, 'Actif')"></button>
        } @else {
          <soc-tooltip position="left">
            <button socMenuItem label="Activer" disabled></button>
            <span socTooltipLabel>Prévisualisez le tableau de bord avant de l'activer.</span>
          </soc-tooltip>
        }
      </soc-menu>
    </ng-template>

    <soc-data-table
      title="Tableaux de bord"
      subtitle="Chaque tableau de bord est visible par les employés de sa population, et d'elle seule."
      [columns]="columns()"
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
    </soc-data-table>
    @if (charge() && !filtered().length) {
      <soc-message class="tableaux__vide" variant="inline" status="info">
        <span socMessageContent>{{ query() ? 'Aucun tableau de bord ne correspond à « ' + query() + ' ».' : 'Aucun tableau de bord pour le moment.' }}</span>
      </soc-message>
    }
  `,
})
export class TableauxDeBordPageComponent {
  private readonly service = inject(TableauxDeBordService);
  private readonly populationsService = inject(PopulationsService);

  private readonly statutCell = viewChild.required<TemplateRef<DataTableCellContext<LigneTableau>>>('statutCell');
  private readonly tableaux = signal<TableauDeBord[]>([]);
  private readonly populations = signal<Map<string, string>>(new Map());
  protected readonly charge = signal(false);

  protected readonly rowKey = (t: LigneTableau) => t.id;
  protected readonly query = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly columns = computed<DataTableColumn<LigneTableau>[]>(() => [
    { key: 'libelle', header: 'Libellé', render: (t) => t.libelle },
    // Colonnes limitées (pas de « Créé par », description courte) : le tableau du kit ne gère pas la largeur (GAP-DS #4).
    { key: 'description', header: 'Description', render: (t) => extrait(t.description, 30) },
    { key: 'population', header: 'Population', render: (t) => t.populationNom },
    { key: 'statut', header: 'Statut', render: this.statutCell() },
    { key: 'widgets', header: 'Widgets', render: (t) => String(t.widgets.length) },
    { key: 'creeLe', header: 'Date de création', render: (t) => new Date(t.creeLe).toLocaleDateString('fr-FR') },
  ]);

  protected readonly lignes = computed<LigneTableau[]>(() =>
    this.tableaux().map((t) => ({ ...t, populationNom: this.populations().get(t.populationId) ?? '—', activable: peutEtreActive(t) })),
  );
  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q ? this.lignes().filter((t) => t.libelle.toLowerCase().includes(q)) : this.lignes();
  });
  protected readonly pageRows = computed(() => this.filtered().slice((this.page() - 1) * this.pageSize(), this.page() * this.pageSize()));
  protected readonly pagination = computed(() => ({
    currentPage: this.page(),
    totalPages: Math.max(1, Math.ceil(this.filtered().length / this.pageSize())),
    totalEntries: this.filtered().length,
    pageSize: this.pageSize(),
  }));

  constructor() {
    this.charger();
  }

  protected couleur(statut: StatutTableauDeBord): TagColor {
    return COULEURS_STATUT[statut];
  }

  protected onSearch(query: string): void {
    this.query.set(query);
    this.page.set(1);
  }

  protected onPageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }

  protected changerStatut(ligne: LigneTableau, statut: StatutTableauDeBord): void {
    this.service.changerStatut(ligne.id, statut).subscribe(() => this.charger());
  }

  private charger(): void {
    forkJoin([this.service.getAll(), this.populationsService.getAll()]).subscribe(([tableaux, populations]) => {
      this.populations.set(new Map(populations.map((p) => [p.id, p.nom])));
      this.tableaux.set(tableaux);
      this.charge.set(true);
    });
  }
}
