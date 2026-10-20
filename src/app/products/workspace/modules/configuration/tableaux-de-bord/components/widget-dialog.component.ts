import { Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  SocDialog,
  SocInputText,
  SocMultiSelect,
  SocSelect,
  type DialogAction,
  type MultiSelectOption,
  type SelectOption,
} from '@socium-design/angular-components';
import type { Employe } from '../../../employes/models/employe.model';
import type { SectionTableau } from '../../../tableau-de-bord/models/tableau-de-bord.model';
import { LIBELLES_STATUTS_DEMANDE, type StatutDemande } from '../../../tableau-de-bord/models/workflow.model';
import { libelleFiltre, type WidgetVue } from '../../../tableau-de-bord/services/widgets';
import type { Population } from '../../populations/models/population.model';
import { valeursDuChamp } from '../../populations/services/population-regles';

/** Modifications d'un graphe saisies dans la modale « Modifier le KPI ». */
export interface ModificationWidget {
  titre: string;
  description: string;
  sectionId: string;
  filtres: string[];
  /** KPI filtrable par population : population choisie ('' = toute la population). */
  populationId: string;
  /** Statistique de workflow personnalisé : statuts affichés (vide = tous). */
  statuts: StatutDemande[];
}

/** Toute la population : pas de filtre « Population » sur la carte (valeur non vide : `soc-select` traite '' comme « aucun choix »). */
const TOUTE_LA_POPULATION = 'toute-la-population';

/**
 * Modale « Modifier le KPI » : titre, description, section et filtres d'un graphe du tableau de bord. Les KPI marqués
 * filtrables par population dans le catalogue ont en plus un filtre « Population » ; une statistique de workflow
 * personnalisé se filtre par statut de demande.
 */
@Component({
  selector: 'app-widget-dialog',
  imports: [ReactiveFormsModule, SocDialog, SocInputText, SocSelect, SocMultiSelect],
  styles: `.kpi { display: flex; flex-direction: column; gap: var(--bridges-position-gap-lg); }`,
  template: `
    <soc-dialog [open]="!!vue()" title="Modifier le KPI" [primaryAction]="enregistrer" [secondaryAction]="annuler" (close)="annule.emit()">
      <form class="kpi" [formGroup]="form" (ngSubmit)="valider()">
        <soc-input-text
          formControlName="titre"
          label="Titre"
          required
          [error]="tentative() && !form.controls.titre.value.trim()"
          [helperText]="tentative() && !form.controls.titre.value.trim() ? 'Le titre est obligatoire.' : undefined"
        />
        <!-- soc-input-text plutôt que soc-input-area : un textarea s'affiche écrasé dans une soc-dialog (GAP-DS #14). -->
        <soc-input-text formControlName="description" label="Description" />
        <soc-select formControlName="sectionId" label="Section" [options]="optionsSections()" />
        @if (vue()?.widget?.workflow) {
          <soc-multi-select formControlName="statuts" label="Statut" placeholder="Tous les statuts" [options]="optionsStatuts" data-testid="filtre-statuts" />
        }
        @if (vue()?.indicateur?.filtrablePopulation) {
          <soc-select formControlName="populationId" label="Population" [options]="optionsPopulations()" data-testid="filtre-population" />
        }
        @if (optionsFiltres().length) {
          <!-- GAP-DS : soc-multi-select n'a pas de recherche dans sa liste. -->
          <soc-multi-select formControlName="filtres" label="Filtres" placeholder="Rechercher et sélectionner des filtres" [options]="optionsFiltres()" />
        }
      </form>
    </soc-dialog>
  `,
})
export class WidgetDialogComponent {
  /** Graphe modifié ; `null` = modale fermée. */
  readonly vue = input<WidgetVue | null>(null);
  readonly sections = input.required<SectionTableau[]>();
  readonly employes = input.required<Employe[]>();
  readonly populations = input<Population[]>([]);
  readonly enregistre = output<ModificationWidget>();
  readonly annule = output<void>();

  protected readonly tentative = signal(false);
  protected readonly form = new FormGroup({
    titre: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    sectionId: new FormControl('', { nonNullable: true }),
    filtres: new FormControl<string[]>([], { nonNullable: true }),
    populationId: new FormControl(TOUTE_LA_POPULATION, { nonNullable: true }),
    statuts: new FormControl<string[]>([], { nonNullable: true }),
  });

  protected readonly optionsSections = computed<SelectOption[]>(() => this.sections().map((s) => ({ value: s.id, label: s.libelle })));
  protected readonly optionsPopulations = computed<SelectOption[]>(() => [
    { value: TOUTE_LA_POPULATION, label: 'Toute la population' },
    ...this.populations().map((p) => ({ value: p.id, label: p.nom })),
  ]);
  protected readonly optionsStatuts: MultiSelectOption[] = Object.entries(LIBELLES_STATUTS_DEMANDE).map(([value, label]) => ({ value, label }));
  /** Filtres proposés : les valeurs existantes des champs filtrables de l'indicateur. */
  protected readonly optionsFiltres = computed<MultiSelectOption[]>(() => {
    const vue = this.vue();
    if (!vue) return [];
    return vue.indicateur.filtresDisponibles.flatMap((champ) =>
      valeursDuChamp(champ, this.employes()).map((v) => ({ value: `${champ}:${v}`, label: libelleFiltre(`${champ}:${v}`) })),
    );
  });

  protected readonly enregistrer: DialogAction = { label: 'Enregistrer', onClick: () => this.valider() };
  protected readonly annuler: DialogAction = { label: 'Annuler', onClick: () => this.annule.emit() };

  constructor() {
    effect(() => {
      const vue = this.vue();
      if (!vue) return;
      untracked(() => {
        this.tentative.set(false);
        this.form.reset({
          titre: vue.titre,
          description: vue.description,
          sectionId: vue.widget.sectionId,
          filtres: [...vue.widget.filtres],
          populationId: vue.widget.populationId ?? TOUTE_LA_POPULATION,
          statuts: [...(vue.widget.workflow?.statuts ?? [])],
        });
      });
    });
  }

  protected valider(): void {
    this.tentative.set(true);
    if (!this.form.controls.titre.value.trim()) return;
    const valeur = this.form.getRawValue();
    const populationId = valeur.populationId === TOUTE_LA_POPULATION ? '' : valeur.populationId;
    this.enregistre.emit({ ...valeur, populationId, statuts: valeur.statuts as StatutDemande[] });
  }
}
