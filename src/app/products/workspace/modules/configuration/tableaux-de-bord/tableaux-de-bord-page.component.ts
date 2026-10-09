import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { LucideCopy, LucidePencil, LucidePlus, LucideTrash } from '@lucide/angular';
import {
  SocBadge,
  SocButton,
  SocButtonLeftIcon,
  SocDataTable,
  SocDataTableActions,
  SocDataTableBadge,
  SocDataTableFilters,
  SocDialog,
  SocMenu,
  SocMenuItem,
  SocMenuItemIcon,
  SocMessage,
  SocMessageContent,
  SocSearchBar,
  type DataTableCellContext,
  type DataTableColumn,
  type DialogAction,
} from '@socium-design/angular-components';
import { forkJoin } from 'rxjs';
import type { Gabarit, TableauDeBord } from '../../tableau-de-bord/models/tableau-de-bord.model';
import { CatalogueService } from '../../tableau-de-bord/services/catalogue.service';
import { TableauxDeBordService } from '../../tableau-de-bord/services/tableaux-de-bord.service';
import { TableauDeBordDialogComponent } from './components/tableau-de-bord-dialog.component';
import { ProfilsComponent, StatutTableauComponent } from './components/pastilles.component';

/**
 * Workspace > Configuration > onglet Gestion des tableaux de bord — liste des tableaux de bord du client.
 * Création et modification des informations en modale ; « Détail » = composition en lecture seule ; « Visualiser » =
 * consultation de ce tableau. Contenu d'onglet : pas de template de page à lui.
 */
@Component({
  selector: 'app-tableaux-de-bord-page',
  imports: [
    SocDataTable, SocDataTableBadge, SocDataTableActions, SocDataTableFilters, SocBadge, SocButton, SocButtonLeftIcon, SocMenu, SocMenuItem,
    SocMenuItemIcon, SocMessage, SocMessageContent, SocSearchBar, SocDialog, ProfilsComponent, StatutTableauComponent, TableauDeBordDialogComponent,
    LucidePlus, LucidePencil, LucideCopy, LucideTrash,
  ],
  styles: `
    .tableaux__vide { display: block; margin-top: var(--bridges-position-gap-md); }
    .tableaux__boutons { display: flex; gap: var(--bridges-position-gap-xs); }
  `,
  template: `
    <ng-template #profilsCell let-row>
      <app-profils [profils]="row.profils" />
    </ng-template>
    <ng-template #statutCell let-row>
      <app-statut-tableau [statut]="row.statut" />
    </ng-template>
    <ng-template #boutonsCell let-row>
      <div class="tableaux__boutons">
        <button socButton variant="secondary" data-testid="detail" (click)="detail(row)">Détail</button>
        <button socButton variant="secondary" data-testid="visualiser" (click)="visualiser(row)">Visualiser</button>
      </div>
    </ng-template>

    <ng-template #actionsMenu let-row let-close="close">
      <soc-menu>
        <button socMenuItem label="Modifier" (click)="close(); modifier(row)">
          <svg lucidePencil socMenuItemIcon class="size-full" [strokeWidth]="1.5"></svg>
        </button>
        <button socMenuItem label="Dupliquer" (click)="close(); dupliquer(row)">
          <svg lucideCopy socMenuItemIcon class="size-full" [strokeWidth]="1.5"></svg>
        </button>
        <button socMenuItem label="Supprimer" (click)="close(); aSupprimer.set(row)">
          <svg lucideTrash socMenuItemIcon class="size-full" [strokeWidth]="1.5"></svg>
        </button>
      </soc-menu>
    </ng-template>

    <soc-data-table
      title="Tableaux de bord"
      subtitle="Chaque tableau de bord présente ses graphes sur le périmètre de sa population, aux profils choisis."
      [columns]="columns()"
      [rows]="pageRows()"
      [rowKey]="rowKey"
      [rowActionsMenu]="actionsMenu"
      [pagination]="pagination()"
      (pageChange)="page.set($event)"
      (pageSizeChange)="onPageSize($event)"
    >
      <soc-badge socDataTableBadge color="primary">{{ tableaux().length }}</soc-badge>
      <!-- Recherche du tableau remplacée par une soc-search-bar : son texte indicatif n'est pas paramétrable (GAP-DS). -->
      <soc-search-bar socDataTableFilters placeholder="Rechercher un tableau de bord..." [value]="query()" (valueChange)="onSearch($event)" (clear)="onSearch('')" />
      <button socButton socDataTableActions (click)="creer()">
        <svg lucidePlus socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
        Nouveau tableau de bord
      </button>
    </soc-data-table>
    @if (charge() && !filtered().length) {
      <soc-message class="tableaux__vide" variant="inline" status="info">
        <span socMessageContent data-testid="vide">{{ query() ? 'Aucun résultat pour cette recherche.' : 'Aucun tableau de bord configuré.' }}</span>
      </soc-message>
    }

    <app-tableau-de-bord-dialog [open]="dialogueOuvert()" [tableau]="enModification()" (annule)="dialogueOuvert.set(false)" (enregistre)="apresEnregistrement($event)" />

    <soc-dialog [open]="!!aSupprimer()" title="Supprimer le tableau de bord ?" [primaryAction]="confirmerSuppression" [secondaryAction]="annulerSuppression" (close)="aSupprimer.set(null)">
      <p>"{{ aSupprimer()?.libelle }}" sera définitivement supprimé. Les utilisateurs concernés perdront l'accès à ce tableau de bord.</p>
    </soc-dialog>
  `,
})
export class TableauxDeBordPageComponent {
  private readonly router = inject(Router);
  private readonly service = inject(TableauxDeBordService);
  private readonly catalogue = inject(CatalogueService);

  private readonly profilsCell = viewChild.required<TemplateRef<DataTableCellContext<TableauDeBord>>>('profilsCell');
  private readonly statutCell = viewChild.required<TemplateRef<DataTableCellContext<TableauDeBord>>>('statutCell');
  private readonly boutonsCell = viewChild.required<TemplateRef<DataTableCellContext<TableauDeBord>>>('boutonsCell');
  protected readonly tableaux = signal<TableauDeBord[]>([]);
  private readonly gabarits = signal<Gabarit[]>([]);
  protected readonly charge = signal(false);

  protected readonly rowKey = (t: TableauDeBord) => t.id;
  protected readonly query = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly dialogueOuvert = signal(false);
  /** Tableau dont on modifie les informations ; `null` en création. */
  protected readonly enModification = signal<TableauDeBord | null>(null);
  protected readonly aSupprimer = signal<TableauDeBord | null>(null);

  protected readonly columns = computed<DataTableColumn<TableauDeBord>[]>(() => [
    { key: 'libelle', header: 'Nom', render: (t) => t.libelle },
    { key: 'modele', header: 'Modèle de base', render: (t) => this.gabarits().find((g) => g.id === t.modele)?.libelle ?? '—' },
    { key: 'profils', header: 'Profils', render: this.profilsCell() },
    { key: 'statut', header: 'Statut', render: this.statutCell() },
    { key: 'creeLe', header: 'Date de création', render: (t) => new Date(t.creeLe).toLocaleDateString('fr-FR') },
    { key: 'boutons', header: '', render: this.boutonsCell() },
  ]);

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q ? this.tableaux().filter((t) => t.libelle.toLowerCase().includes(q)) : this.tableaux();
  });
  protected readonly pageRows = computed(() => this.filtered().slice((this.page() - 1) * this.pageSize(), this.page() * this.pageSize()));
  protected readonly pagination = computed(() => ({
    currentPage: this.page(),
    totalPages: Math.max(1, Math.ceil(this.filtered().length / this.pageSize())),
    totalEntries: this.filtered().length,
    pageSize: this.pageSize(),
  }));

  protected readonly confirmerSuppression: DialogAction = { label: 'Supprimer', onClick: () => this.supprimer() };
  protected readonly annulerSuppression: DialogAction = { label: 'Annuler', onClick: () => this.aSupprimer.set(null) };

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
    this.enModification.set(null);
    this.dialogueOuvert.set(true);
  }

  protected modifier(tableau: TableauDeBord): void {
    this.enModification.set(tableau);
    this.dialogueOuvert.set(true);
  }

  /** Après création ou modification des informations : on compose le tableau. */
  protected apresEnregistrement(tableau: TableauDeBord): void {
    this.dialogueOuvert.set(false);
    this.router.navigate(['/workspace/configuration/tableaux-de-bord', tableau.id], { queryParams: { mode: 'edition' } });
  }

  /** « Détail » : la composition en lecture seule. */
  protected detail(tableau: TableauDeBord): void {
    this.router.navigate(['/workspace/configuration/tableaux-de-bord', tableau.id]);
  }

  /** « Visualiser » : la consultation de ce tableau. */
  protected visualiser(tableau: TableauDeBord): void {
    this.router.navigate(['/workspace/tableau-de-bord'], { queryParams: { tableau: tableau.id } });
  }

  protected dupliquer(tableau: TableauDeBord): void {
    this.service.dupliquer(tableau.id).subscribe(() => this.charger());
  }

  private supprimer(): void {
    const tableau = this.aSupprimer();
    this.aSupprimer.set(null);
    if (tableau) this.service.remove(tableau.id).subscribe(() => this.charger());
  }

  private charger(): void {
    forkJoin([this.service.getAll(), this.catalogue.getGabarits()]).subscribe(([tableaux, gabarits]) => {
      this.gabarits.set(gabarits);
      this.tableaux.set(tableaux);
      this.charge.set(true);
    });
  }
}
