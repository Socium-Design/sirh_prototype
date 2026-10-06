import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  SocBadge,
  SocBreadcrumb,
  SocButton,
  SocButtonLeftIcon,
  SocDataTable,
  SocPageActions,
  SocPageBadge,
  SocPageBreadcrumb,
  SocPageList,
  SocTag,
  type DataTableCellContext,
  type DataTableColumn,
} from '@socium-design/angular-components';
import { LucidePlus } from '@lucide/angular';
import type { Employe } from './models/employe.model';
import { EmployesService } from './services/employes.service';

/**
 * PAGE DE RÉFÉRENCE (liste) — modèle à suivre pour toute page « liste d'objets » :
 * `soc-page-list` + `soc-data-table`, données via un service, recherche et pagination pilotées par la page
 * (le tableau du design system est purement présentationnel : il émet `search`/`pageChange`, la page filtre et découpe).
 */
@Component({
  selector: 'app-employes-page',
  imports: [SocPageList, SocPageBreadcrumb, SocPageBadge, SocPageActions, SocBreadcrumb, SocBadge, SocButton, SocButtonLeftIcon, SocDataTable, SocTag, LucidePlus],
  template: `
    <ng-template #statutCell let-row>
      <soc-tag [color]="row.statut === 'Actif' ? 'success' : 'information'">{{ row.statut }}</soc-tag>
    </ng-template>

    <soc-page-list title="Employés" description="Consultez et recherchez les collaborateurs de l'entreprise.">
      <soc-breadcrumb socPageBreadcrumb [items]="[{ label: 'Workspace' }, { label: 'Employés' }]" />
      <soc-badge socPageBadge color="primary">{{ total() }}</soc-badge>
      <button socButton socPageActions size="lg">
        <svg lucidePlus socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
        Ajouter un employé
      </button>

      <soc-data-table
        [columns]="columns()"
        [rows]="pageRows()"
        [rowKey]="rowKey"
        [searchable]="true"
        (search)="onSearch($event)"
        [pagination]="pagination()"
        (pageChange)="page.set($event)"
        (pageSizeChange)="onPageSize($event)"
      />
    </soc-page-list>
  `,
})
export class EmployesPageComponent {
  private readonly employes = toSignal(inject(EmployesService).getAll(), { initialValue: [] as Employe[] });
  private readonly statutCell = viewChild.required<TemplateRef<DataTableCellContext<Employe>>>('statutCell');

  protected readonly rowKey = (e: Employe) => e.id;
  protected readonly query = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly columns = computed<DataTableColumn<Employe>[]>(() => [
    { key: 'nom', header: 'Nom', render: (e) => `${e.prenom} ${e.nom}` },
    { key: 'poste', header: 'Poste', render: (e) => e.poste },
    { key: 'departement', header: 'Département', render: (e) => e.departement },
    { key: 'email', header: 'Email', render: (e) => e.email },
    { key: 'statut', header: 'Statut', render: this.statutCell() },
    { key: 'entree', header: "Date d'entrée", render: (e) => new Date(e.dateEntree).toLocaleDateString('fr-FR') },
  ]);

  private readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.employes();
    return this.employes().filter((e) => [e.prenom, e.nom, e.poste, e.departement, e.email, e.matricule].some((v) => v.toLowerCase().includes(q)));
  });

  protected readonly total = computed(() => this.employes().length);
  protected readonly pageRows = computed(() => this.filtered().slice((this.page() - 1) * this.pageSize(), this.page() * this.pageSize()));
  protected readonly pagination = computed(() => ({
    currentPage: this.page(),
    totalPages: Math.max(1, Math.ceil(this.filtered().length / this.pageSize())),
    totalEntries: this.filtered().length,
    pageSize: this.pageSize(),
  }));

  protected onSearch(query: string): void {
    this.query.set(query);
    this.page.set(1);
  }

  protected onPageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }
}
