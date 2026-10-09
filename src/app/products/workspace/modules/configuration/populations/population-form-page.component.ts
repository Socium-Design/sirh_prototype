import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators, type ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  SocBreadcrumb,
  SocButton,
  SocButtonLeftIcon,
  SocCheckbox,
  SocInputArea,
  SocInputText,
  SocMessage,
  SocMessageContent,
  SocPageActions,
  SocPageBreadcrumb,
  SocPageForm,
  SocPageMessage,
  SocPageStepper,
  SocRadioButton,
  SocSelect,
  SocStepper,
  type SelectOption,
  type StepperItemData,
} from '@socium-design/angular-components';
import { LucidePlus, LucideTrash } from '@lucide/angular';
import { forkJoin, map } from 'rxjs';
import type { Employe } from '../../employes/models/employe.model';
import { EmployesService } from '../../employes/services/employes.service';
import { PopulationImpactDialogComponent } from './components/population-impact-dialog.component';
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
} from './models/population.model';
import { copierRegles, employesCouverts, populationsSimilaires, valeursDuChamp } from './services/population-regles';
import { PopulationsService } from './services/populations.service';

type ConditionForm = FormGroup<{
  champ: FormControl<ChampCondition>;
  operateur: FormControl<OperateurCondition>;
  valeur: FormControl<string>;
}>;

const LISTE = '/workspace/configuration/populations';

/** N'accepte qu'une page interne du Workspace comme page de retour. */
const pageDeRetour = (url: string | null): string | null => (url?.startsWith('/workspace/') ? url : null);

const nonVide = (c: AbstractControl<string>): ValidationErrors | null => (c.value.trim() ? null : { required: true });
const auMoinsUne = (c: AbstractControl<unknown[]>): ValidationErrors | null => (c.value.length ? null : { aucuneCondition: true });

/**
 * Workspace > Configuration > Populations — création / modification en 2 étapes (informations, filtres).
 * La même page sert aux deux routes : `populations/nouvelle` et `populations/:id/modifier`.
 */
@Component({
  selector: 'app-population-form-page',
  imports: [
    ReactiveFormsModule, SocPageForm, SocPageBreadcrumb, SocPageStepper, SocPageMessage, SocPageActions, SocBreadcrumb, SocStepper,
    SocButton, SocButtonLeftIcon, SocInputText, SocInputArea, SocCheckbox, SocSelect, SocRadioButton, SocMessage, SocMessageContent,
    PopulationImpactDialogComponent, LucidePlus, LucideTrash,
  ],
  styleUrl: './population-form-page.component.scss',
  template: `
    <soc-page-form
      [title]="id ? 'Modifier la population' : 'Créer une population'"
      [sectionTitle]="etape() === 1 ? 'Informations' : 'Filtres'"
      [sectionSubtitle]="etape() === 1 ? 'Nommez la population et, si besoin, partez d\\'une population existante.' : 'Les employés qui respectent ces conditions font partie de la population.'"
      [showBack]="true"
      (back)="retourListe()"
    >
      <soc-breadcrumb socPageBreadcrumb [items]="breadcrumb" />
      <soc-stepper socPageStepper [items]="stepper()" />
      @if (erreurs().length) {
        <soc-message socPageMessage status="error" title="Le formulaire contient des erreurs">
          <span socMessageContent>{{ erreurs().join(' ') }}</span>
        </soc-message>
      }

      <form class="formulaire" [formGroup]="form" (ngSubmit)="suivant()">
        @if (etape() === 1) {
          <soc-input-text
            formControlName="nom"
            label="Nom"
            required
            placeholder="Ex. Équipe Sénégal"
            [error]="erreurNom() !== null"
            [helperText]="erreurNom() ?? undefined"
          />
          <soc-input-area formControlName="description" label="Description" placeholder="À quoi sert cette population ?" />
          @if (!id) {
            <soc-checkbox formControlName="utiliserModele" label="Utiliser une population existante comme modèle" />
            @if (form.controls.utiliserModele.value) {
              <soc-select
                formControlName="sourceId"
                label="Population modèle"
                required
                placeholder="Choisir une population"
                [options]="optionsSources()"
                [error]="tentative1() && !form.controls.sourceId.value"
                [helperText]="tentative1() && !form.controls.sourceId.value ? 'Choisissez la population à copier.' : 'Ses règles sont copiées ; la population modèle reste inchangée.'"
              />
            }
          }
        } @else {
          <!-- En rouge quand aucun employé ne correspond (calcul automatique, pas d'action « Estimer »). -->
          <soc-message variant="inline" [status]="nbEmployes() ? 'info' : 'error'">
            <span socMessageContent data-testid="compteur">{{ compteur() }}</span>
          </soc-message>
          @if (similaires().length) {
            <soc-message variant="inline" status="warning">
              <span socMessageContent data-testid="similaire">{{ alerteSimilaire() }}</span>
            </soc-message>
          }

          <div class="formulaire__combinaison" role="radiogroup" aria-label="Combinaison des conditions">
            <soc-radio-button formControlName="combinaison" name="combinaison" value="ET" id="combinaison-et" label="ET — toutes les conditions" />
            <soc-radio-button formControlName="combinaison" name="combinaison" value="OU" id="combinaison-ou" label="OU — au moins une condition" />
          </div>

          <div class="formulaire__conditions" formArrayName="conditions">
            @for (condition of form.controls.conditions.controls; track condition; let i = $index) {
              <div class="condition" [formGroupName]="i" data-testid="condition">
                <!-- soc-select est en display: contents : la largeur se règle sur un conteneur. Libellé dans le champ (mode compact). -->
                <div class="condition__champ">
                  <soc-select formControlName="champ" label="Champ" mode="labelHeader" [options]="optionsChamps" />
                </div>
                <div class="condition__operateur">
                  <soc-select formControlName="operateur" label="Opérateur" mode="labelHeader" [options]="optionsOperateurs" />
                </div>
                <div class="condition__valeur">
                  <soc-select
                    formControlName="valeur"
                    label="Valeur"
                    mode="labelHeader"
                    placeholder="Choisir"
                    [options]="optionsValeurs()[condition.controls.champ.value]"
                    [error]="tentative2() && condition.controls.valeur.invalid"
                    [helperText]="tentative2() && condition.controls.valeur.invalid ? 'Valeur obligatoire.' : undefined"
                  />
                </div>
                <button socButton type="button" variant="tertiary" class="condition__supprimer" [attr.aria-label]="'Supprimer la condition ' + (i + 1)" (click)="supprimerCondition(i)">
                  <svg lucideTrash socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
                </button>
              </div>
            }
          </div>

          <button socButton type="button" variant="secondary" class="formulaire__ajouter" (click)="ajouterCondition()">
            <svg lucidePlus socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
            Ajouter une condition
          </button>
        }
      </form>

      @if (etape() === 1) {
        <button socButton socPageActions type="button" variant="secondary" size="lg" (click)="retourListe()">Annuler</button>
      } @else {
        <button socButton socPageActions type="button" variant="secondary" size="lg" (click)="etape.set(1)">Précédent</button>
      }
      @if (etape() === 1) {
        <button socButton socPageActions type="button" size="lg" (click)="suivant()">Suivant</button>
      } @else {
        <button socButton socPageActions type="button" size="lg" (click)="enregistrer()">{{ id ? 'Enregistrer' : 'Créer la population' }}</button>
      }
    </soc-page-form>

    <app-population-impact-dialog
      [open]="impactOuvert()"
      mode="modification"
      [populationNom]="form.controls.nom.value"
      [usages]="usages()"
      (confirm)="sauvegarder($event)"
      (cancel)="impactOuvert.set(false)"
    />
  `,
})
export class PopulationFormPageComponent {
  private readonly router = inject(Router);
  private readonly service = inject(PopulationsService);
  private readonly employes = toSignal(inject(EmployesService).getAll(), { initialValue: [] as Employe[] });

  private readonly route = inject(ActivatedRoute).snapshot;
  /** Id de la population modifiée ; absent en création. */
  protected readonly id = this.route.paramMap.get('id');
  /** Page d'où l'on vient (ex. formulaire d'un tableau de bord) : on y revient après enregistrement ou annulation. */
  private readonly retour = pageDeRetour(this.route.queryParamMap.get('retour'));
  private readonly populations = signal<Population[]>([]);
  /** Éléments qui utilisent la population modifiée. */
  protected readonly usages = signal<PopulationUsage[]>([]);

  protected readonly etape = signal<1 | 2>(1);
  protected readonly tentative1 = signal(false);
  protected readonly tentative2 = signal(false);
  protected readonly impactOuvert = signal(false);

  protected readonly form = new FormGroup({
    nom: new FormControl('', { nonNullable: true, validators: [nonVide, (c) => this.nomUnique(c)] }),
    description: new FormControl('', { nonNullable: true }),
    utiliserModele: new FormControl(false, { nonNullable: true }),
    sourceId: new FormControl('', { nonNullable: true }),
    combinaison: new FormControl<Combinaison>('ET', { nonNullable: true }),
    conditions: new FormArray<ConditionForm>([], { validators: auMoinsUne }),
  });

  /** Valeur courante du formulaire, en signal (alimente le compteur d'employés en direct). */
  private readonly valeur = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue())), { initialValue: this.form.getRawValue() });

  protected readonly breadcrumb = [
    { label: 'Workspace' },
    { label: 'Configurations', onClick: () => this.router.navigateByUrl(LISTE) },
    { label: 'Populations', onClick: () => this.router.navigateByUrl(LISTE) },
    { label: this.id ? 'Modifier' : 'Nouvelle population' },
  ];

  protected readonly stepper = computed<StepperItemData[]>(() => [
    { label: 'Informations', status: this.etape() === 1 ? 'current' : 'completed' },
    { label: 'Filtres', status: this.etape() === 2 ? 'current' : 'upcoming' },
  ]);

  protected readonly optionsChamps: SelectOption[] = Object.entries(LIBELLES_CHAMPS).map(([value, label]) => ({ value, label }));
  protected readonly optionsOperateurs: SelectOption[] = Object.entries(LIBELLES_OPERATEURS).map(([value, label]) => ({ value, label }));
  protected readonly optionsValeurs = computed(() => {
    const options = {} as Record<ChampCondition, SelectOption[]>;
    for (const champ of Object.keys(LIBELLES_CHAMPS) as ChampCondition[]) {
      options[champ] = valeursDuChamp(champ, this.employes()).map((v) => ({ value: v, label: v }));
    }
    return options;
  });
  protected readonly optionsSources = computed<SelectOption[]>(() => this.populations().map((p) => ({ value: p.id, label: p.nom })));

  /** Employés couverts par les règles saisies (les conditions encore sans valeur sont ignorées). */
  protected readonly nbEmployes = computed(() => {
    const { combinaison, conditions } = this.valeur();
    return employesCouverts({ combinaison, conditions: conditions.filter((c) => c.valeur) }, this.employes()).length;
  });
  protected readonly compteur = computed(() => {
    const n = this.nbEmployes();
    return n ? `${n} employé${n > 1 ? 's' : ''} correspond${n > 1 ? 'ent' : ''} à ces règles.` : 'Aucun employé ne correspond à ces règles.';
  });

  /** Populations existantes aux critères identiques ou couvrant les mêmes employés (alerte non bloquante). */
  protected readonly similaires = computed(() => {
    const { combinaison, conditions } = this.valeur();
    return populationsSimilaires({ combinaison, conditions: conditions.filter((c) => c.valeur) }, this.populations(), this.employes(), this.id);
  });
  protected readonly alerteSimilaire = computed(() =>
    this.similaires()
      .map(({ population, raison }) =>
        raison === 'criteres-identiques' ? `« ${population.nom} » a déjà exactement ces critères.` : `« ${population.nom} » couvre déjà exactement les mêmes employés.`,
      )
      .concat('Vous pouvez tout de même enregistrer.')
      .join(' '),
  );

  protected readonly erreurNom = computed(() => {
    this.valeur();
    if (!this.tentative1() && !this.form.controls.nom.touched) return null;
    const errors = this.form.controls.nom.errors;
    if (errors?.['required']) return 'Le nom est obligatoire.';
    if (errors?.['nomExistant']) return 'Une population porte déjà ce nom.';
    return null;
  });

  /** Récapitulatif des erreurs de l'étape 2, affiché après une tentative d'enregistrement. */
  protected readonly erreurs = computed(() => {
    this.valeur();
    if (this.etape() !== 2 || !this.tentative2()) return [];
    const erreurs: string[] = [];
    if (!this.form.controls.nom.valid) erreurs.push('Le nom est obligatoire et doit être unique (étape Informations).');
    const conditions = this.form.controls.conditions;
    if (!conditions.length) erreurs.push('Ajoutez au moins une condition.');
    else if (conditions.controls.some((c) => c.controls.valeur.invalid)) erreurs.push('Chaque condition doit avoir une valeur.');
    return erreurs;
  });

  constructor() {
    this.form.controls.sourceId.valueChanges.subscribe((id) => {
      const source = this.populations().find((p) => p.id === id);
      if (source) this.appliquerRegles(source);
    });

    forkJoin([this.service.getAll(), this.service.getUsages()]).subscribe(([populations, usages]) => {
      this.populations.set(populations);
      if (!this.id) {
        this.ajouterCondition();
        return;
      }
      const population = populations.find((p) => p.id === this.id);
      if (!population) {
        this.retourListe();
        return;
      }
      this.usages.set(usages.filter((u) => u.populationId === this.id));
      this.form.patchValue({ nom: population.nom, description: population.description });
      this.appliquerRegles(population);
    });
  }

  protected ajouterCondition(condition: ConditionPopulation = { champ: 'site', operateur: 'est', valeur: '' }): void {
    const groupe: ConditionForm = new FormGroup({
      champ: new FormControl(condition.champ, { nonNullable: true }),
      operateur: new FormControl(condition.operateur, { nonNullable: true }),
      valeur: new FormControl(condition.valeur, { nonNullable: true, validators: Validators.required }),
    });
    // Les valeurs possibles dépendent du champ : changer de champ vide la valeur.
    groupe.controls.champ.valueChanges.subscribe(() => groupe.controls.valeur.setValue(''));
    this.form.controls.conditions.push(groupe);
  }

  protected supprimerCondition(index: number): void {
    this.form.controls.conditions.removeAt(index);
  }

  protected suivant(): void {
    this.tentative1.set(true);
    const { nom, utiliserModele, sourceId } = this.form.controls;
    nom.markAsTouched();
    if (nom.invalid || (utiliserModele.value && !sourceId.value)) return;
    this.etape.set(2);
  }

  protected enregistrer(): void {
    this.tentative2.set(true);
    this.form.markAllAsTouched();
    if (this.form.controls.nom.invalid || this.form.controls.conditions.invalid) return;
    if (this.id && this.usages().length) this.impactOuvert.set(true);
    else this.sauvegarder([]);
  }

  /** `usagesMisAJour` : éléments cochés dans la modale d'impact (modification uniquement). */
  protected sauvegarder(usagesMisAJour: string[]): void {
    this.impactOuvert.set(false);
    const { nom, description, combinaison, conditions } = this.form.getRawValue();
    const saisie: PopulationSaisie = { nom, description, combinaison, conditions };
    const requete = this.id ? this.service.update(this.id, saisie, usagesMisAJour) : this.service.create(saisie);
    requete.subscribe(() => this.retourListe());
  }

  protected retourListe(): void {
    this.router.navigateByUrl(this.retour ?? LISTE);
  }

  /** Remplace les règles du formulaire par une copie indépendante de celles de `source`. */
  private appliquerRegles(source: Population): void {
    const regles = copierRegles(source);
    this.form.controls.conditions.clear();
    regles.conditions.forEach((c) => this.ajouterCondition(c));
    this.form.controls.combinaison.setValue(regles.combinaison);
  }

  private nomUnique(control: AbstractControl<string>): ValidationErrors | null {
    const nom = control.value.trim().toLocaleLowerCase('fr');
    const existe = this.populations?.().some((p) => p.id !== this.id && p.nom.trim().toLocaleLowerCase('fr') === nom);
    return existe ? { nomExistant: true } : null;
  }
}
