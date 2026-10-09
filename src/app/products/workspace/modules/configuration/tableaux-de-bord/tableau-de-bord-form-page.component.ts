import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, type ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  SocBreadcrumb,
  SocButton,
  SocInputArea,
  SocInputText,
  SocMessage,
  SocMessageContent,
  SocPageActions,
  SocPageBreadcrumb,
  SocPageForm,
  SocPageMessage,
  SocPageSecondContent,
  SocPageStepper,
  SocRadioButton,
  SocSelect,
  SocStepper,
  SocTag,
  type SelectOption,
  type StepperItemData,
} from '@socium-design/angular-components';
import { forkJoin, map } from 'rxjs';
import { SessionService } from '../../../../../core/session/session.service';
import type { Employe } from '../../employes/models/employe.model';
import { EmployesService } from '../../employes/services/employes.service';
import type { Indicateur } from '../../tableau-de-bord/models/indicateur.model';
import type { PointDeDepart, StatutTableauDeBord, TableauDeBord, TableauDeBordSaisie } from '../../tableau-de-bord/models/tableau-de-bord.model';
import { TableauxDeBordService } from '../../tableau-de-bord/services/tableaux-de-bord.service';
import { LIBELLES_CHAMPS, LIBELLES_OPERATEURS, type Population } from '../populations/models/population.model';
import { employesCouverts } from '../populations/services/population-regles';
import { PopulationsService } from '../populations/services/populations.service';

const LISTE = '/workspace/configuration/tableaux-de-bord';
type TypeDepart = PointDeDepart['type'];

const nonVide = (c: AbstractControl<string>): ValidationErrors | null => (c.value.trim() ? null : { required: true });

/**
 * Workspace > Configuration > Gestion des tableaux de bord — création (2 étapes : informations, point de départ)
 * et modification des informations générales. La composition (widgets) se fait ensuite dans la Bibliothèque.
 */
@Component({
  selector: 'app-tableau-de-bord-form-page',
  imports: [
    ReactiveFormsModule, SocPageForm, SocPageBreadcrumb, SocPageStepper, SocPageMessage, SocPageActions, SocPageSecondContent, SocBreadcrumb,
    SocStepper, SocButton, SocInputText, SocInputArea, SocSelect, SocRadioButton, SocMessage, SocMessageContent, SocTag,
  ],
  styleUrl: './tableau-de-bord-form-page.component.scss',
  template: `
    <soc-page-form
      [title]="id ? 'Modifier le tableau de bord' : 'Créer un tableau de bord'"
      [sectionTitle]="etape() === 1 ? 'Informations' : 'Point de départ'"
      [sectionSubtitle]="etape() === 1 ? 'Le tableau de bord sera visible par les employés de sa population, et d\\'elle seule.' : 'Composition initiale du tableau de bord, modifiable ensuite dans la Bibliothèque.'"
      [secondSectionTitle]="etape() === 1 && population() ? 'Critères de la population' : undefined"
      [secondSectionSubtitle]="etape() === 1 && population() ? population()!.nom : undefined"
      [showBack]="true"
      (back)="retourListe()"
    >
      <soc-breadcrumb socPageBreadcrumb [items]="breadcrumb" />
      @if (!id) {
        <soc-stepper socPageStepper [items]="stepper()" />
      }
      @if (erreur()) {
        <soc-message socPageMessage status="error" title="Le formulaire contient des erreurs">
          <span socMessageContent>{{ erreur() }}</span>
        </soc-message>
      }

      <form class="formulaire" [formGroup]="form">
        @if (etape() === 1) {
          <soc-input-text
            formControlName="libelle"
            label="Libellé"
            required
            placeholder="Ex. Dashboard RH Global"
            [error]="erreurLibelle() !== null"
            [helperText]="erreurLibelle() ?? undefined"
          />
          <soc-input-area formControlName="description" label="Description" placeholder="À quoi sert ce tableau de bord ?" />

          <div class="formulaire__groupe" role="radiogroup" aria-label="Statut">
            <span class="formulaire__libelle">Statut</span>
            <div class="formulaire__radios">
              @for (statut of statuts(); track statut.valeur) {
                <!-- Pas de formControlName : une seule option est désactivable (« Actif »), pas tout le contrôle. -->
                <soc-radio-button
                  name="statut"
                  [id]="'statut-' + statut.valeur"
                  [label]="statut.valeur"
                  [selected]="valeur().statut === statut.valeur"
                  [disabled]="statut.indisponible"
                  (select)="form.controls.statut.setValue(statut.valeur)"
                />
              }
            </div>
            @if (!activable()) {
              <span class="formulaire__aide">Le tableau de bord pourra être activé après une prévisualisation.</span>
            }
          </div>

          <soc-select
            formControlName="populationId"
            label="Population cible"
            required
            placeholder="Choisir une population"
            [options]="optionsPopulations()"
            [error]="tentative() && !form.controls.populationId.value"
            [helperText]="tentative() && !form.controls.populationId.value ? 'Choisissez la population qui aura accès au tableau de bord.' : undefined"
          />
        } @else {
          <div class="formulaire__groupe" role="radiogroup" aria-label="Point de départ">
            <soc-radio-button formControlName="depart" name="depart" value="v0" id="depart-v0" label="Version V0 pré-remplie (recommandé)" />
            <soc-radio-button formControlName="depart" name="depart" value="vide" id="depart-vide" label="Tableau de bord vide" />
            <soc-radio-button formControlName="depart" name="depart" value="copie" id="depart-copie" label="Copie d'un tableau de bord existant" />
          </div>
          @if (form.controls.depart.value === 'copie') {
            <soc-select
              formControlName="sourceId"
              label="Tableau de bord à copier"
              required
              placeholder="Choisir un tableau de bord"
              [options]="optionsSources()"
              [error]="tentative() && !form.controls.sourceId.value"
              [helperText]="tentative() && !form.controls.sourceId.value ? 'Choisissez le tableau de bord à copier.' : 'Ses sections et widgets sont copiés ; le tableau d\\'origine reste inchangé.'"
            />
          }
          <soc-message variant="inline" status="info">
            <span socMessageContent data-testid="apercu-depart">{{ apercuDepart() }}</span>
          </soc-message>
        }
      </form>

      @if (etape() === 1 && population(); as pop) {
        <div socPageSecondContent class="criteres" data-testid="criteres">
          <p>{{ pop.combinaison === 'ET' ? 'Toutes les conditions (ET)' : 'Au moins une condition (OU)' }}</p>
          <div class="criteres__conditions">
            @for (condition of pop.conditions; track $index) {
              <soc-tag color="information">{{ libelleCondition(condition) }}</soc-tag>
            }
          </div>
          <soc-tag [color]="nbCouverts() ? 'success' : 'error'" data-testid="nb-couverts">
            {{ nbCouverts() }} employé{{ nbCouverts() > 1 ? 's' : '' }} couvert{{ nbCouverts() > 1 ? 's' : '' }}
          </soc-tag>
          @if (adminRh()) {
            <button socButton type="button" variant="secondary" class="criteres__modifier" (click)="modifierCriteres(pop)">Modifier les critères</button>
          } @else {
            <soc-message variant="inline" status="info">
              <span socMessageContent>Seul un admin RH peut modifier les critères de la population.</span>
            </soc-message>
          }
        </div>
      }

      @if (etape() === 1) {
        <button socButton socPageActions type="button" variant="secondary" size="lg" (click)="retourListe()">Annuler</button>
      } @else {
        <button socButton socPageActions type="button" variant="secondary" size="lg" (click)="etape.set(1)">Précédent</button>
      }
      @if (id) {
        <button socButton socPageActions type="button" size="lg" (click)="enregistrer()">Enregistrer</button>
      } @else if (etape() === 1) {
        <button socButton socPageActions type="button" size="lg" (click)="suivant()">Suivant</button>
      } @else {
        <button socButton socPageActions type="button" size="lg" (click)="enregistrer()">Créer le tableau de bord</button>
      }
    </soc-page-form>
  `,
})
export class TableauDeBordFormPageComponent {
  private readonly router = inject(Router);
  private readonly service = inject(TableauxDeBordService);
  private readonly session = inject(SessionService);
  private readonly employes = toSignal(inject(EmployesService).getAll(), { initialValue: [] as Employe[] });

  /** Id du tableau modifié ; absent en création. */
  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  private readonly tableaux = signal<TableauDeBord[]>([]);
  private readonly populations = signal<Population[]>([]);
  private readonly indicateursV0 = signal<Indicateur[]>([]);
  private readonly tableau = computed(() => this.tableaux().find((t) => t.id === this.id));

  protected readonly etape = signal<1 | 2>(1);
  protected readonly tentative = signal(false);
  protected readonly adminRh = computed(() => this.session.role() === 'admin-rh');

  protected readonly form = new FormGroup({
    libelle: new FormControl('', { nonNullable: true, validators: [nonVide, (c) => this.libelleUnique(c)] }),
    description: new FormControl('', { nonNullable: true }),
    statut: new FormControl<StatutTableauDeBord>('Inactif', { nonNullable: true }),
    populationId: new FormControl('', { nonNullable: true }),
    depart: new FormControl<TypeDepart>('v0', { nonNullable: true }),
    sourceId: new FormControl('', { nonNullable: true }),
  });
  protected readonly valeur = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue())), { initialValue: this.form.getRawValue() });

  protected readonly breadcrumb = [
    { label: 'Workspace' },
    { label: 'Configurations', onClick: () => this.retourListe() },
    { label: 'Gestion des tableaux de bord', onClick: () => this.retourListe() },
    { label: this.id ? 'Modifier' : 'Nouveau tableau de bord' },
  ];

  protected readonly stepper = computed<StepperItemData[]>(() => [
    { label: 'Informations', status: this.etape() === 1 ? 'current' : 'completed' },
    { label: 'Point de départ', status: this.etape() === 2 ? 'current' : 'upcoming' },
  ]);

  /** Un tableau ne peut passer « Actif » qu'après une prévisualisation (jamais à la création). */
  protected readonly activable = computed(() => this.tableau()?.statut === 'Actif' || !!this.tableau()?.previsualise);
  /** Pas d'« Archivé » à la création. */
  protected readonly statuts = computed(() =>
    (this.id ? (['Actif', 'Inactif', 'Archivé'] as const) : (['Actif', 'Inactif'] as const)).map((valeur) => ({
      valeur,
      indisponible: valeur === 'Actif' && !this.activable(),
    })),
  );

  protected readonly optionsPopulations = computed<SelectOption[]>(() => this.populations().map((p) => ({ value: p.id, label: p.nom })));
  protected readonly optionsSources = computed<SelectOption[]>(() => this.tableaux().map((t) => ({ value: t.id, label: t.libelle })));

  protected readonly population = computed(() => this.populations().find((p) => p.id === this.valeur().populationId));
  protected readonly nbCouverts = computed(() => {
    const pop = this.population();
    return pop ? employesCouverts(pop, this.employes()).length : 0;
  });

  protected readonly apercuDepart = computed(() => {
    const { depart, sourceId } = this.valeur();
    if (depart === 'vide') return 'Le tableau de bord démarre sans widget.';
    if (depart === 'copie') {
      const source = this.tableaux().find((t) => t.id === sourceId);
      return source ? `${source.widgets.length} widget(s) copié(s) depuis « ${source.libelle} ».` : 'Choisissez le tableau de bord à copier.';
    }
    const v0 = this.indicateursV0();
    return `${v0.length} widgets courants : ${v0.map((i) => i.titre).join(', ')}.`;
  });

  protected readonly erreurLibelle = computed(() => {
    this.valeur();
    if (!this.tentative() && !this.form.controls.libelle.touched) return null;
    const errors = this.form.controls.libelle.errors;
    if (errors?.['required']) return 'Le libellé est obligatoire.';
    if (errors?.['libelleExistant']) return 'Un tableau de bord porte déjà ce libellé.';
    return null;
  });

  protected readonly erreur = signal<string | null>(null);

  constructor() {
    forkJoin([this.service.getAll(), inject(PopulationsService).getAll(), this.service.getIndicateursV0()]).subscribe(([tableaux, populations, v0]) => {
      this.tableaux.set(tableaux);
      this.populations.set(populations);
      this.indicateursV0.set(v0);
      const brouillon = this.service.brouillon;
      if (brouillon && (brouillon.id ?? null) === this.id) {
        this.restaurer(brouillon.saisie, brouillon.depart);
        this.service.brouillon = null;
      } else if (this.id) {
        const tableau = this.tableau();
        if (!tableau) return this.retourListe();
        this.form.patchValue({ libelle: tableau.libelle, description: tableau.description, statut: tableau.statut, populationId: tableau.populationId });
      }
      this.form.controls.libelle.updateValueAndValidity();
    });
  }

  protected libelleCondition(c: Population['conditions'][number]): string {
    return `${LIBELLES_CHAMPS[c.champ]} ${LIBELLES_OPERATEURS[c.operateur].toLowerCase()} ${c.valeur}`;
  }

  protected suivant(): void {
    if (this.etape1Valide()) {
      this.tentative.set(false);
      this.etape.set(2);
    }
  }

  protected enregistrer(): void {
    if (!this.etape1Valide()) return this.etape.set(1);
    const { depart, sourceId } = this.form.getRawValue();
    if (!this.id && depart === 'copie' && !sourceId) {
      this.tentative.set(true);
      return;
    }
    const requete = this.id ? this.service.update(this.id, this.saisie()) : this.service.create(this.saisie(), this.pointDeDepart());
    requete.subscribe({ next: () => this.retourListe(), error: (e: Error) => this.erreur.set(e.message) });
  }

  /** Part modifier la population (page Populations) en gardant la saisie en cours, puis revient ici. */
  protected modifierCriteres(population: Population): void {
    this.service.brouillon = { id: this.id, saisie: this.saisie(), depart: this.pointDeDepart() };
    this.router.navigate(['/workspace/configuration/populations', population.id, 'modifier'], { queryParams: { retour: this.router.url } });
  }

  protected retourListe(): void {
    this.router.navigateByUrl(LISTE);
  }

  private etape1Valide(): boolean {
    this.tentative.set(true);
    this.form.controls.libelle.markAsTouched();
    return this.form.controls.libelle.valid && !!this.form.controls.populationId.value;
  }

  private saisie(): TableauDeBordSaisie {
    const { libelle, description, statut, populationId } = this.form.getRawValue();
    return { libelle, description, statut, populationId };
  }

  private pointDeDepart(): PointDeDepart {
    const { depart, sourceId } = this.form.getRawValue();
    return depart === 'copie' ? { type: 'copie', sourceId } : { type: depart };
  }

  private restaurer(saisie: TableauDeBordSaisie, depart: PointDeDepart): void {
    this.form.patchValue({ ...saisie, depart: depart.type, sourceId: depart.type === 'copie' ? depart.sourceId : '' });
  }

  private libelleUnique(control: AbstractControl<string>): ValidationErrors | null {
    const libelle = control.value.trim().toLocaleLowerCase('fr');
    const existe = this.tableaux?.().some((t) => t.id !== this.id && t.libelle.trim().toLocaleLowerCase('fr') === libelle);
    return existe ? { libelleExistant: true } : null;
  }
}
