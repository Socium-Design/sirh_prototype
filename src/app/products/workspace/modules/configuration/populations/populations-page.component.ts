import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
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
  type DataTableCellContext,
  type DataTableColumn,
  type DialogAction,
} from '@socium-design/angular-components';
import { LucidePencil, LucidePlus, LucideTrash } from '@lucide/angular';
import { forkJoin } from 'rxjs';
import { extrait } from '../../../../../shared/utils/texte';
import type { Employe } from '../../employes/models/employe.model';
import { EmployesService } from '../../employes/services/employes.service';
import { PopulationFormDialogComponent, type PopulationEnregistree } from './components/population-form-dialog.component';
import { PopulationImpactDialogComponent } from './components/population-impact-dialog.component';
import type { Population, PopulationUsage } from './models/population.model';
import { employesCouverts } from './services/population-regles';
import { PopulationsService } from './services/populations.service';

interface LignePopulation extends Population {
  nbEmployes: number;
  usages: PopulationUsage[];
}

/** « 1 personne », « 12 personnes ». */
export const personnes = (n: number): string => `${n} personne${n > 1 ? 's' : ''}`;

/**
 * Workspace > Configuration > onglet Populations — liste des populations (groupes d'employés servant de périmètre aux
 * tableaux de bord). Création et modification en modale. Contenu d'onglet : pas de template de page à lui.
 */
@Component({
  selector: 'app-populations-page',
  styles: `.populations__message { display: block; margin-top: var(--bridges-position-gap-md); }`,
  imports: [
    SocBadge, SocButton, SocButtonLeftIcon, SocDataTable, SocDataTableBadge, SocDataTableActions, SocMenu, SocMenuItem, SocMenuItemIcon,
    SocDialog, SocMessage, SocMessageContent, PopulationFormDialogComponent, PopulationImpactDialogComponent, LucidePlus, LucidePencil, LucideTrash,
  ],
  template: `
    <ng-template #voirCell let-row>
      <button socButton variant="secondary" data-testid="voir" (click)="voir(row)">Voir</button>
    </ng-template>

    <ng-template #actionsMenu let-row let-close="close">
      <soc-menu>
        <button socMenuItem label="Modifier" (click)="close(); modifier(row)">
          <svg lucidePencil socMenuItemIcon class="size-full" [strokeWidth]="1.5"></svg>
        </button>
        <button socMenuItem label="Supprimer" (click)="close(); demanderSuppression(row)">
          <svg lucideTrash socMenuItemIcon class="size-full" [strokeWidth]="1.5"></svg>
        </button>
      </soc-menu>
    </ng-template>

    @if (message()) {
      <soc-message class="populations__message" variant="inline" status="success">
        <span socMessageContent data-testid="message">{{ message() }}</span>
      </soc-message>
    }

    <soc-data-table
      title="Populations"
      subtitle="Groupes d'employés définis par des conditions, utilisés comme périmètre des tableaux de bord."
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
      <button socButton socDataTableActions (click)="creer()">
        <svg lucidePlus socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
        Nouvelle population
      </button>
    </soc-data-table>
    @if (charge() && !filtered().length) {
      <soc-message class="populations__message" variant="inline" status="info">
        <span socMessageContent>{{ query() ? 'Aucune population ne correspond à « ' + query() + ' ».' : 'Aucune population pour le moment.' }}</span>
      </soc-message>
    }

    <app-population-form-dialog [open]="formulaireOuvert()" [population]="enModification()" (enregistre)="apresEnregistrement($event)" (annule)="fermerFormulaire()" />

    <soc-dialog [open]="!!aConfirmer()" title="Supprimer la population ?" [primaryAction]="confirmerSuppression" [secondaryAction]="annulerSuppression" (close)="aConfirmer.set(null)">
      <p>« {{ aConfirmer()?.nom }} » sera définitivement supprimée.</p>
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
  private readonly employes = toSignal(inject(EmployesService).getAll(), { initialValue: [] as Employe[] });

  private readonly populations = signal<Population[]>([]);
  private readonly usages = signal<(PopulationUsage & { populationId: string })[]>([]);
  protected readonly charge = signal(false);
  protected readonly message = signal<string | null>(null);

  protected readonly rowKey = (p: LignePopulation) => p.id;
  protected readonly query = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly formulaireOuvert = signal(false);
  /** Population en cours de modification ; `null` en création. */
  protected readonly enModification = signal<Population | null>(null);
  protected readonly aConfirmer = signal<LignePopulation | null>(null);
  protected readonly impact = signal<LignePopulation | null>(null);

  private readonly voirCell = viewChild.required<TemplateRef<DataTableCellContext<LignePopulation>>>('voirCell');
  protected readonly columns = computed<DataTableColumn<LignePopulation>[]>(() => [
    { key: 'nom', header: 'Nom', render: (p) => p.nom },
    { key: 'description', header: 'Description', render: (p) => extrait(p.description, 60) },
    { key: 'effectif', header: 'Effectif concerné', render: (p) => personnes(p.nbEmployes) },
    { key: 'voir', header: '', render: this.voirCell() },
  ]);

  protected readonly lignes = computed<LignePopulation[]>(() =>
    this.populations().map((p) => ({
      ...p,
      nbEmployes: employesCouverts(p, this.employes()).length,
      usages: this.usages().filter((u) => u.populationId === p.id),
    })),
  );

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
    this.message.set(null);
    this.enModification.set(null);
    this.formulaireOuvert.set(true);
  }

  protected modifier(ligne: LignePopulation): void {
    this.message.set(null);
    this.enModification.set(this.populations().find((p) => p.id === ligne.id) ?? null);
    this.formulaireOuvert.set(true);
  }

  protected voir(ligne: LignePopulation): void {
    this.router.navigate(['/workspace/configuration/populations', ligne.id]);
  }

  protected fermerFormulaire(): void {
    this.formulaireOuvert.set(false);
  }

  protected apresEnregistrement({ creation }: PopulationEnregistree): void {
    this.formulaireOuvert.set(false);
    // Pas de toast dans le kit (GAP-DS #12) : message en tête de liste.
    if (creation) this.message.set('Population créée avec succès');
    this.charger();
  }

  /** Utilisée par des tableaux de bord → modale d'impact ; sinon simple confirmation. */
  protected demanderSuppression(ligne: LignePopulation): void {
    this.message.set(null);
    if (ligne.usages.length) this.impact.set(ligne);
    else this.aConfirmer.set(ligne);
  }

  protected supprimer(ligne: LignePopulation, tableauxRetires: string[]): void {
    this.aConfirmer.set(null);
    this.impact.set(null);
    this.service.remove(ligne.id, tableauxRetires).subscribe(() => this.charger());
  }

  private charger(): void {
    forkJoin([this.service.getAll(), this.service.getUsages()]).subscribe(([populations, usages]) => {
      this.populations.set(populations);
      this.usages.set(usages);
      this.charge.set(true);
    });
  }
}
