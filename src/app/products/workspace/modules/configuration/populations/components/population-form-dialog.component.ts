import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucidePlus, LucideTrash } from '@lucide/angular';
import {
  SocBadge,
  SocButton,
  SocButtonLeftIcon,
  SocDialog,
  SocInputText,
  SocMultiSelect,
  SocSelect,
  SocTabs,
  type DialogAction,
  type MultiSelectOption,
  type SelectOption,
  type TabItem,
} from '@socium-design/angular-components';
import { forkJoin, map } from 'rxjs';
import type { Employe } from '../../../employes/models/employe.model';
import { EmployesService } from '../../../employes/services/employes.service';
import {
  LIBELLES_CHAMPS,
  LIBELLES_OPERATEURS,
  type ChampCondition,
  type Combinaison,
  type ConditionPopulation,
  type OperateurCondition,
  type Population,
  type PopulationSaisie,
  type PopulationUsage,
} from '../models/population.model';
import { employesCouverts, populationDeMemeNom, valeursDuChamp } from '../services/population-regles';
import { PopulationsService } from '../services/populations.service';
import { PopulationImpactDialogComponent } from './population-impact-dialog.component';

type ConditionForm = FormGroup<{
  champ: FormControl<ChampCondition>;
  operateur: FormControl<OperateurCondition>;
  valeurs: FormControl<string[]>;
}>;

/** Fin du formulaire : la population enregistrée, et si elle vient d'être créée. */
export interface PopulationEnregistree {
  population: Population;
  creation: boolean;
}

const INDICATIONS: Record<Combinaison, string> = {
  ET: 'Toutes les conditions doivent être vraies.',
  OU: 'Au moins une condition doit être vraie.',
};

/**
 * Création / modification d'une population, en modale sur un seul écran : informations, conditions de filtrage (ET / OU)
 * et effectif correspondant calculé en direct. Gère aussi l'alerte de population similaire (création) et la modale
 * d'impact (modification d'une population utilisée par des tableaux de bord).
 * `population` absente = création.
 */
@Component({
  selector: 'app-population-form-dialog',
  imports: [
    ReactiveFormsModule, SocDialog, SocInputText, SocSelect, SocMultiSelect, SocTabs, SocBadge, SocButton, SocButtonLeftIcon,
    PopulationImpactDialogComponent, LucidePlus, LucideTrash,
  ],
  styleUrl: './population-form-dialog.component.scss',
  template: `
    <soc-dialog [open]="open()" [title]="population() ? 'Modifier la population' : 'Nouvelle population'" [primaryAction]="enregistrerAction()" [secondaryAction]="annulerAction" (close)="annule.emit()">
      <form class="population" [formGroup]="form" (ngSubmit)="enregistrer()">
        <p class="population__sous-titre">
          {{ population() ? 'Modifiez les informations et les critères de filtrage.' : 'Définissez les informations et les critères de filtrage.' }}
        </p>
        <soc-input-text
          formControlName="nom"
          label="Nom"
          required
          placeholder="Ex : Managers – périmètre hiérarchique"
          [error]="erreurNom()"
          [helperText]="erreurNom() ? 'Le nom est obligatoire.' : undefined"
        />
        <!-- soc-input-text plutôt que soc-input-area : un textarea s'affiche écrasé dans une soc-dialog (GAP-DS #14). -->
        <soc-input-text formControlName="description" label="Description" placeholder="Décris le périmètre en une phrase..." />

        <section class="population__conditions" aria-label="Conditions de filtrage">
          <div class="population__entete">
            <p class="population__titre">Conditions de filtrage</p>
            <!-- GAP-DS : pas de contrôle segmenté dans le kit → onglets « pill ». -->
            <soc-tabs variant="pill" [items]="combinaisons" [value]="valeur().combinaison" (change)="form.controls.combinaison.setValue($any($event))" />
          </div>
          <p class="population__aide" data-testid="indication">{{ indication() }}</p>

          <div class="population__lignes" formArrayName="conditions">
            @for (condition of form.controls.conditions.controls; track condition; let i = $index) {
              @if (i > 0) {
                <soc-badge class="population__liaison" color="primary" data-testid="liaison">{{ valeur().combinaison }}</soc-badge>
              }
              <div class="condition" [formGroupName]="i" data-testid="condition">
                <!-- soc-select est en display: contents : la largeur se règle sur un conteneur. -->
                <div class="condition__champ">
                  <soc-select formControlName="champ" [options]="optionsChamps" placeholder="Champ" />
                </div>
                <div class="condition__operateur">
                  <soc-select formControlName="operateur" [options]="optionsOperateurs" placeholder="Opérateur" />
                </div>
                <div class="condition__valeurs">
                  <soc-multi-select
                    formControlName="valeurs"
                    placeholder="Sélectionner..."
                    [options]="optionsValeurs()[condition.controls.champ.value]"
                    [error]="tentative() && !condition.controls.valeurs.value.length"
                    [helperText]="tentative() && !condition.controls.valeurs.value.length ? 'Choisissez au moins une valeur.' : undefined"
                  />
                </div>
                <button
                  socButton
                  type="button"
                  variant="ghost"
                  aria-label="Supprimer la condition"
                  title="Supprimer la condition"
                  [disabled]="form.controls.conditions.length === 1"
                  (click)="supprimerCondition(i)"
                >
                  <svg lucideTrash socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
                </button>
              </div>
            }
          </div>

          <button socButton type="button" variant="ghost" class="population__ajouter" (click)="ajouterCondition()">
            <svg lucidePlus socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
            Ajouter une condition
          </button>
        </section>

        <section class="effectif" [class.effectif--vide]="!effectif()" aria-label="Effectif correspondant">
          <p class="effectif__titre">Effectif correspondant</p>
          <p class="effectif__nombre" data-testid="effectif">{{ effectif() }}</p>
          <p class="effectif__libelle">personne(s) dans ce périmètre</p>
        </section>
      </form>
    </soc-dialog>

    <soc-dialog [open]="similaireOuverte()" title="Population similaire détectée" [primaryAction]="creerQuandMeme" [secondaryAction]="annulerSimilaire" (close)="similaireOuverte.set(false)">
      <p data-testid="similaire">Une population avec le nom « {{ valeur().nom.trim() }} » existe déjà. Voulez-vous quand même la créer ?</p>
    </soc-dialog>

    <app-population-impact-dialog
      [open]="impactOuvert()"
      mode="modification"
      [populationNom]="population()?.nom ?? ''"
      [usages]="usages()"
      (confirm)="sauvegarder($event)"
      (cancel)="impactOuvert.set(false)"
    />
  `,
})
export class PopulationFormDialogComponent {
  readonly open = input(false);
  /** Population modifiée ; absente en création. */
  readonly population = input<Population | null>(null);
  readonly enregistre = output<PopulationEnregistree>();
  readonly annule = output<void>();

  private readonly service = inject(PopulationsService);
  private readonly employes = toSignal(inject(EmployesService).getAll(), { initialValue: [] as Employe[] });
  private readonly populations = signal<Population[]>([]);
  /** Tableaux de bord qui utilisent la population modifiée. */
  protected readonly usages = signal<PopulationUsage[]>([]);

  protected readonly tentative = signal(false);
  protected readonly similaireOuverte = signal(false);
  protected readonly impactOuvert = signal(false);

  protected readonly form = new FormGroup({
    nom: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    combinaison: new FormControl<Combinaison>('ET', { nonNullable: true }),
    conditions: new FormArray<ConditionForm>([]),
  });
  /** Valeur courante du formulaire, en signal (alimente l'effectif en direct). */
  protected readonly valeur = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue())), { initialValue: this.form.getRawValue() });

  protected readonly combinaisons: TabItem[] = [
    { id: 'ET', label: 'ET' },
    { id: 'OU', label: 'OU' },
  ];
  protected readonly indication = computed(() => INDICATIONS[this.valeur().combinaison]);
  protected readonly optionsChamps: SelectOption[] = Object.entries(LIBELLES_CHAMPS).map(([value, label]) => ({ value, label }));
  protected readonly optionsOperateurs: SelectOption[] = Object.entries(LIBELLES_OPERATEURS).map(([value, label]) => ({ value, label }));
  protected readonly optionsValeurs = computed(() => {
    const options = {} as Record<ChampCondition, MultiSelectOption[]>;
    for (const champ of Object.keys(LIBELLES_CHAMPS) as ChampCondition[]) {
      options[champ] = valeursDuChamp(champ, this.employes()).map((v) => ({ value: v, label: v }));
    }
    return options;
  });

  /** Employés couverts par les conditions saisies (les conditions encore sans valeur sont ignorées). */
  protected readonly effectif = computed(() => {
    const { combinaison, conditions } = this.valeur();
    return employesCouverts({ combinaison, conditions: conditions.filter((c) => c.valeurs.length) }, this.employes()).length;
  });

  protected readonly erreurNom = computed(() => this.tentative() && !this.valeur().nom.trim());

  /** GAP-DS : `DialogAction` n'a pas d'état désactivé → le clic sur un nom vide affiche l'erreur du champ. */
  protected readonly enregistrerAction = computed<DialogAction>(() => ({
    label: this.population() ? 'Enregistrer les modifications' : 'Créer la population',
    onClick: () => this.enregistrer(),
  }));
  protected readonly annulerAction: DialogAction = { label: 'Annuler', onClick: () => this.annule.emit() };
  protected readonly creerQuandMeme: DialogAction = { label: 'Créer quand même', onClick: () => this.sauvegarder([]) };
  protected readonly annulerSimilaire: DialogAction = { label: 'Annuler', onClick: () => this.similaireOuverte.set(false) };

  constructor() {
    // À chaque ouverture : formulaire vierge (création) ou rechargé depuis la population, conditions comprises.
    effect(() => {
      if (!this.open()) return;
      const population = this.population();
      untracked(() => this.initialiser(population));
    });
  }

  protected ajouterCondition(condition: ConditionPopulation = { champ: 'site', operateur: 'est', valeurs: [] }): void {
    const groupe: ConditionForm = new FormGroup({
      champ: new FormControl(condition.champ, { nonNullable: true }),
      operateur: new FormControl(condition.operateur, { nonNullable: true }),
      valeurs: new FormControl([...condition.valeurs], { nonNullable: true }),
    });
    // Les valeurs possibles dépendent du champ : changer de champ vide les valeurs.
    groupe.controls.champ.valueChanges.subscribe(() => groupe.controls.valeurs.setValue([]));
    this.form.controls.conditions.push(groupe);
  }

  protected supprimerCondition(index: number): void {
    if (this.form.controls.conditions.length > 1) this.form.controls.conditions.removeAt(index);
  }

  protected enregistrer(): void {
    this.tentative.set(true);
    const { nom, conditions } = this.form.getRawValue();
    if (!nom.trim() || conditions.some((c) => !c.valeurs.length)) return;
    if (this.population()) {
      if (this.usages().length) this.impactOuvert.set(true);
      else this.sauvegarder([]);
    } else if (populationDeMemeNom(nom, this.populations())) {
      this.similaireOuverte.set(true);
    } else {
      this.sauvegarder([]);
    }
  }

  /** `tableauxMisAJour` : tableaux de bord cochés dans la modale d'impact (modification uniquement). */
  protected sauvegarder(tableauxMisAJour: string[]): void {
    this.similaireOuverte.set(false);
    this.impactOuvert.set(false);
    const { nom, description, combinaison, conditions } = this.form.getRawValue();
    const saisie: PopulationSaisie = { nom, description, combinaison, conditions };
    const existante = this.population();
    const requete = existante ? this.service.update(existante.id, saisie, tableauxMisAJour) : this.service.create(saisie);
    requete.subscribe((population) => this.enregistre.emit({ population, creation: !existante }));
  }

  private initialiser(population: Population | null): void {
    this.tentative.set(false);
    this.similaireOuverte.set(false);
    this.impactOuvert.set(false);
    this.form.controls.conditions.clear({ emitEvent: false });
    this.form.reset({ nom: population?.nom ?? '', description: population?.description ?? '', combinaison: population?.combinaison ?? 'ET' });
    if (population?.conditions.length) population.conditions.forEach((c) => this.ajouterCondition(c));
    else this.ajouterCondition();

    this.usages.set([]);
    forkJoin([this.service.getAll(), this.service.getUsages()]).subscribe(([populations, usages]) => {
      this.populations.set(populations);
      if (population) this.usages.set(usages.filter((u) => u.populationId === population.id));
    });
  }
}
