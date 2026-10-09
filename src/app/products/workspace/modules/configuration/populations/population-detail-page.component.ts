import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { LucidePencil, LucideTrash } from '@lucide/angular';
import {
  SocBreadcrumb,
  SocButton,
  SocButtonLeftIcon,
  SocDataTable,
  SocDialog,
  SocPageActions,
  SocPageBreadcrumb,
  SocPageDetails,
  SocTooltip,
  SocTooltipLabel,
  type DataTableColumn,
  type DialogAction,
} from '@socium-design/angular-components';
import { forkJoin } from 'rxjs';
import type { Employe } from '../../employes/models/employe.model';
import { EmployesService } from '../../employes/services/employes.service';
import { PopulationFormDialogComponent } from './components/population-form-dialog.component';
import { PopulationImpactDialogComponent } from './components/population-impact-dialog.component';
import { libelleCondition, type Population, type PopulationUsage } from './models/population.model';
import { employesCouverts } from './services/population-regles';
import { PopulationsService } from './services/populations.service';

const LISTE = '/workspace/configuration/populations';

interface Synthese {
  id: string;
  effectif: string;
  operateur: string;
}

/**
 * Workspace > Configuration > Populations > détail : nom, description, effectif, opérateur logique et conditions de filtrage
 * numérotées. « Modifier » ouvre la modale du formulaire ; « Supprimer » la confirmation (ou la modale d'impact).
 */
@Component({
  selector: 'app-population-detail-page',
  imports: [
    SocPageDetails, SocPageBreadcrumb, SocPageActions, SocBreadcrumb, SocButton, SocButtonLeftIcon, SocTooltip, SocTooltipLabel, SocDataTable,
    SocDialog, PopulationFormDialogComponent, PopulationImpactDialogComponent, LucidePencil, LucideTrash,
  ],
  styles: `
    .conditions { display: flex; flex-direction: column; gap: var(--bridges-position-gap-md); }
    .conditions__titre { font-size: var(--bridges-size-text-text-size-lg); color: var(--bridges-color-text-primary); }
    .conditions__liste { display: flex; flex-direction: column; gap: var(--bridges-position-gap-sm); padding-left: var(--bridges-position-padding-lg); list-style: decimal; }
  `,
  template: `
    @if (population(); as pop) {
      <soc-page-details [title]="pop.nom" [description]="pop.description || 'Sans description.'" [showBack]="true" backLabel="Retour aux populations" (back)="retourListe()">
        <soc-breadcrumb socPageBreadcrumb [items]="breadcrumb()" />
        <soc-tooltip socPageActions position="bottom">
          <button socButton variant="tertiary" size="lg" aria-label="Modifier" data-testid="modifier" (click)="formulaireOuvert.set(true)">
            <svg lucidePencil socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
          </button>
          <span socTooltipLabel>Modifier</span>
        </soc-tooltip>
        <soc-tooltip socPageActions position="bottom">
          <button socButton variant="tertiary" size="lg" aria-label="Supprimer" data-testid="supprimer" (click)="demanderSuppression()">
            <svg lucideTrash socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
          </button>
          <span socTooltipLabel>Supprimer</span>
        </soc-tooltip>

        <soc-data-table mode="detail" [columns]="colonnes" [rows]="lignes()" [rowKey]="cle" />

        <section class="conditions" aria-label="Conditions de filtrage" data-testid="conditions">
          <p class="conditions__titre">Conditions de filtrage</p>
          <ol class="conditions__liste">
            @for (condition of pop.conditions; track $index) {
              <li data-testid="condition">{{ libelle(condition) }}</li>
            }
          </ol>
        </section>
      </soc-page-details>

      <app-population-form-dialog [open]="formulaireOuvert()" [population]="pop" (enregistre)="apresModification($event.population)" (annule)="formulaireOuvert.set(false)" />

      <soc-dialog [open]="confirmation()" title="Supprimer la population ?" [primaryAction]="confirmerSuppression" [secondaryAction]="annulerSuppression" (close)="confirmation.set(false)">
        <p>« {{ pop.nom }} » sera définitivement supprimée.</p>
      </soc-dialog>
      <app-population-impact-dialog
        [open]="impactOuvert()"
        mode="suppression"
        [populationNom]="pop.nom"
        [usages]="usages()"
        (confirm)="supprimer($event)"
        (cancel)="impactOuvert.set(false)"
      />
    }
  `,
})
export class PopulationDetailPageComponent {
  private readonly router = inject(Router);
  private readonly service = inject(PopulationsService);
  private readonly employes = toSignal(inject(EmployesService).getAll(), { initialValue: [] as Employe[] });
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;

  protected readonly population = signal<Population | undefined>(undefined);
  protected readonly usages = signal<PopulationUsage[]>([]);
  protected readonly formulaireOuvert = signal(false);
  protected readonly confirmation = signal(false);
  protected readonly impactOuvert = signal(false);

  protected readonly breadcrumb = computed(() => [
    { label: 'Workspace' },
    { label: 'Configurations', onClick: () => this.retourListe() },
    { label: 'Populations', onClick: () => this.retourListe() },
    { label: this.population()?.nom ?? '' },
  ]);
  protected readonly cle = (l: Synthese) => l.id;
  protected readonly colonnes: DataTableColumn<Synthese>[] = [
    { key: 'effectif', header: 'Effectif', render: (l) => l.effectif },
    { key: 'operateur', header: 'OPÉRATEUR LOGIQUE', render: (l) => l.operateur },
  ];
  /** Effectif et opérateur logique, en paires libellé / valeur. */
  protected readonly lignes = computed<Synthese[]>(() => {
    const p = this.population();
    if (!p) return [];
    const n = employesCouverts(p, this.employes()).length;
    return [{ id: p.id, effectif: `${n} personne${n > 1 ? 's' : ''} concernée${n > 1 ? 's' : ''}`, operateur: p.combinaison }];
  });

  protected readonly confirmerSuppression: DialogAction = { label: 'Supprimer', onClick: () => this.supprimer([]) };
  protected readonly annulerSuppression: DialogAction = { label: 'Annuler', onClick: () => this.confirmation.set(false) };

  constructor() {
    this.charger();
  }

  protected libelle = libelleCondition;

  protected demanderSuppression(): void {
    if (this.usages().length) this.impactOuvert.set(true);
    else this.confirmation.set(true);
  }

  protected supprimer(tableauxRetires: string[]): void {
    this.confirmation.set(false);
    this.impactOuvert.set(false);
    this.service.remove(this.id, tableauxRetires).subscribe(() => this.retourListe());
  }

  protected apresModification(population: Population): void {
    this.formulaireOuvert.set(false);
    this.population.set(population);
  }

  protected retourListe(): void {
    this.router.navigateByUrl(LISTE);
  }

  private charger(): void {
    forkJoin([this.service.getById(this.id), this.service.getUsages()]).subscribe(([population, usages]) => {
      if (!population) return this.retourListe();
      this.population.set(population);
      this.usages.set(usages.filter((u) => u.populationId === this.id));
    });
  }
}
