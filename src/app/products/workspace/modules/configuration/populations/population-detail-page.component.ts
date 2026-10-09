import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LucidePencil } from '@lucide/angular';
import {
  SocBreadcrumb,
  SocButton,
  SocButtonLeftIcon,
  SocPageActions,
  SocPageBreadcrumb,
  SocPageDetails,
  SocTag,
  SocTooltip,
  SocTooltipLabel,
} from '@socium-design/angular-components';
import { LIBELLES_CHAMPS, LIBELLES_OPERATEURS, type ConditionPopulation, type Population } from './models/population.model';
import { PopulationsService } from './services/populations.service';

const LISTE = '/workspace/configuration/populations';

/**
 * Workspace > Configuration > Populations > détail, en lecture seule. N'affiche que ce qui définit la population :
 * nom, description, filtres — pas la liste des tableaux de bord ou modules qui l'utilisent.
 */
@Component({
  selector: 'app-population-detail-page',
  imports: [SocPageDetails, SocPageBreadcrumb, SocPageActions, SocBreadcrumb, SocButton, SocButtonLeftIcon, SocTooltip, SocTooltipLabel, SocTag, LucidePencil],
  styles: `
    .filtres { display: flex; flex-direction: column; gap: var(--bridges-position-gap-md); }
    .filtres__conditions { display: flex; flex-wrap: wrap; gap: var(--bridges-position-gap-sm); }
    .filtres__titre { font-size: var(--bridges-size-text-text-size-lg); color: var(--bridges-color-text-primary); }
    .filtres__aide { font-size: var(--bridges-size-text-text-size-sm); color: var(--bridges-color-text-secondary); }
  `,
  template: `
    @if (population(); as pop) {
      <soc-page-details [title]="pop.nom" [description]="pop.description || 'Sans description.'" [showBack]="true" (back)="retourListe()">
        <soc-breadcrumb socPageBreadcrumb [items]="breadcrumb()" />
        <soc-tooltip socPageActions position="bottom">
          <button socButton variant="tertiary" size="lg" aria-label="Modifier" data-testid="modifier" (click)="modifier()">
            <svg lucidePencil socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
          </button>
          <span socTooltipLabel>Modifier la population</span>
        </soc-tooltip>

        <section class="filtres" aria-label="Filtres" data-testid="filtres">
          <p class="filtres__titre">Filtres</p>
          <p class="filtres__aide">{{ pop.combinaison === 'ET' ? 'Toutes les conditions (ET)' : 'Au moins une condition (OU)' }}</p>
          <div class="filtres__conditions">
            @for (condition of pop.conditions; track $index) {
              <soc-tag color="information">{{ libelle(condition) }}</soc-tag>
            }
          </div>
        </section>
      </soc-page-details>
    }
  `,
})
export class PopulationDetailPageComponent {
  private readonly router = inject(Router);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  protected readonly population = signal<Population | undefined>(undefined);
  protected readonly breadcrumb = computed(() => [
    { label: 'Workspace' },
    { label: 'Configurations', onClick: () => this.retourListe() },
    { label: 'Populations', onClick: () => this.retourListe() },
    { label: this.population()?.nom ?? '' },
  ]);

  constructor() {
    inject(PopulationsService)
      .getAll()
      .subscribe((populations) => {
        const population = populations.find((p) => p.id === this.id);
        if (population) this.population.set(population);
        else this.retourListe();
      });
  }

  protected libelle(c: ConditionPopulation): string {
    return `${LIBELLES_CHAMPS[c.champ]} ${LIBELLES_OPERATEURS[c.operateur].toLowerCase()} ${c.valeur}`;
  }

  protected modifier(): void {
    this.router.navigate(['/workspace/configuration/populations', this.id, 'modifier']);
  }

  protected retourListe(): void {
    this.router.navigateByUrl(LISTE);
  }
}
