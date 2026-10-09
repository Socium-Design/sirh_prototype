import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  SocCard,
  SocCardActionSlot,
  SocCardFooter,
  SocCardGrid,
  SocDialog,
  SocInputText,
  SocMessage,
  SocMessageContent,
  SocRadioButton,
  SocSearchBar,
  SocStepper,
  SocTabs,
  SocTag,
  type DialogAction,
  type StepperItemData,
  type TabItem,
} from '@socium-design/angular-components';
import { forkJoin, map } from 'rxjs';
import { GABARIT_PAR_DEFAUT } from '../../../../../../../mocks/data/gabarits.mock';
import type { Employe } from '../../../employes/models/employe.model';
import { EmployesService } from '../../../employes/services/employes.service';
import type { Gabarit, ModeleBase, StatutTableauDeBord, TableauDeBord, TableauDeBordSaisie } from '../../../tableau-de-bord/models/tableau-de-bord.model';
import { CatalogueService } from '../../../tableau-de-bord/services/catalogue.service';
import { TableauxDeBordService } from '../../../tableau-de-bord/services/tableaux-de-bord.service';
import type { Population } from '../../populations/models/population.model';
import { employesCouverts } from '../../populations/services/population-regles';
import { PopulationsService } from '../../populations/services/populations.service';

/**
 * Modale d'un tableau de bord.
 * - Création (`tableau` absent), en 2 étapes : « Information du tableau de bord » puis « Point de départ » (gabarit vide,
 *   Direction Générale, Admin RH, Manager — le gabarit choisi pré-remplit réellement les graphes) ; « Créer et composer ».
 * - Modification : la première étape seule, pré-remplie ; « Suivant — Modifier les indicateurs ».
 * Émet le tableau enregistré : la page enchaîne sur sa composition.
 */
@Component({
  selector: 'app-tableau-de-bord-dialog',
  imports: [
    ReactiveFormsModule, SocDialog, SocStepper, SocInputText, SocTabs, SocSearchBar, SocRadioButton, SocCard, SocCardActionSlot, SocCardFooter, SocCardGrid, SocTag,
    SocMessage, SocMessageContent,
  ],
  styleUrl: './tableau-de-bord-dialog.component.scss',
  template: `
    <soc-dialog [open]="open()" [title]="tableau() ? 'Modifier le tableau de bord' : 'Nouveau tableau de bord'" [primaryAction]="actionPrincipale()" [secondaryAction]="actionSecondaire()" (close)="annule.emit()">
      <form class="tableau" [formGroup]="form" (ngSubmit)="suivant()">
        @if (!tableau()) {
          <soc-stepper [items]="etapes()" />
        }
        @if (erreur()) {
          <soc-message variant="inline" status="error"><span socMessageContent>{{ erreur() }}</span></soc-message>
        }

        @if (etape() === 1) {
          <p class="tableau__titre">Information du tableau de bord</p>
          <soc-input-text
            formControlName="libelle"
            label="Nom du tableau de bord"
            required
            placeholder="Ex : Dashboard RH Global"
            [error]="tentative() && !valeur().libelle.trim()"
            [helperText]="tentative() && !valeur().libelle.trim() ? 'Le nom est obligatoire.' : undefined"
          />
          <!-- soc-input-text plutôt que soc-input-area : un textarea s'affiche écrasé dans une soc-dialog (GAP-DS #14). -->
          <soc-input-text formControlName="description" label="Description" placeholder="À quoi sert ce tableau de bord ?" />

          <div class="tableau__groupe">
            <span class="tableau__libelle">Statut</span>
            <!-- GAP-DS : pas de contrôle segmenté dans le kit → onglets « pill ». -->
            <soc-tabs variant="pill" [items]="statuts" [value]="valeur().statut" (change)="form.controls.statut.setValue($any($event))" />
          </div>

          <div class="tableau__groupe" role="radiogroup" aria-label="Population / Scope">
            <span class="tableau__libelle">Population / Scope <span class="tableau__requis">*</span></span>
            <span class="tableau__aide">Périmètre de données pris en compte dans tous les graphes de ce tableau de bord</span>
            <soc-search-bar placeholder="Rechercher une population..." [value]="recherche()" (valueChange)="recherche.set($event)" (clear)="recherche.set('')" />
            <div class="tableau__populations">
              @for (pop of populationsFiltrees(); track pop.id) {
                <div class="tableau__population" data-testid="population">
                  <soc-radio-button
                    name="population"
                    [id]="'population-' + pop.id"
                    [label]="pop.nom"
                    [selected]="valeur().populationId === pop.id"
                    (select)="form.controls.populationId.setValue(pop.id)"
                  />
                  <span class="tableau__aide">{{ pop.effectif }} pers.</span>
                </div>
              } @empty {
                <span class="tableau__aide">Aucune population ne correspond.</span>
              }
            </div>
            @if (tentative() && !valeur().populationId) {
              <span class="tableau__erreur">Choisissez la population du tableau de bord.</span>
            }
          </div>
        } @else {
          <p class="tableau__titre">Point de départ</p>
          <soc-card-grid [columns]="2" gap="sm">
            @for (gabarit of gabarits(); track gabarit.id) {
              <soc-card type="selectable" [title]="gabarit.libelle" (cardClick)="form.controls.modele.setValue(gabarit.id)" data-testid="gabarit">
                <!-- Emplacement d'action vide : sans lui, le kit affiche un bouton « ⋯ » sans objet ici. -->
                <span socCardActionSlot></span>
                <p class="tableau__aide">{{ gabarit.description }}</p>
                <!-- GAP-DS : soc-card n'a pas d'état « sélectionné » → étiquette dans le pied. -->
                <div socCardFooter class="tableau__pied">
                  <span class="tableau__aide">{{ gabarit.indicateurs.length }} graphe(s)</span>
                  @if (valeur().modele === gabarit.id) {
                    <soc-tag color="success">Sélectionné</soc-tag>
                  }
                </div>
              </soc-card>
            }
          </soc-card-grid>

          <section class="recapitulatif" aria-label="Récapitulatif" data-testid="recapitulatif">
            <p class="recapitulatif__titre">RÉCAPITULATIF</p>
            <dl class="recapitulatif__liste">
              <dt>Nom</dt><dd>{{ valeur().libelle.trim() }}</dd>
              <dt>Population</dt><dd>{{ populationChoisie()?.nom ?? '—' }}</dd>
              <dt>Statut</dt><dd>{{ valeur().statut }}</dd>
              <dt>Point de départ</dt><dd>{{ gabaritChoisi()?.libelle }} · {{ gabaritChoisi()?.indicateurs?.length ?? 0 }} graphe(s)</dd>
            </dl>
          </section>
        }
      </form>
    </soc-dialog>
  `,
})
export class TableauDeBordDialogComponent {
  readonly open = input(false);
  /** Tableau dont on modifie les informations ; absent en création. */
  readonly tableau = input<TableauDeBord | null>(null);
  readonly enregistre = output<TableauDeBord>();
  readonly annule = output<void>();

  private readonly service = inject(TableauxDeBordService);
  private readonly populationsService = inject(PopulationsService);
  private readonly catalogue = inject(CatalogueService);
  private readonly employes = toSignal(inject(EmployesService).getAll(), { initialValue: [] as Employe[] });
  private readonly populations = signal<Population[]>([]);
  protected readonly gabarits = signal<Gabarit[]>([]);

  protected readonly etape = signal<1 | 2>(1);
  protected readonly tentative = signal(false);
  protected readonly recherche = signal('');
  protected readonly erreur = signal<string | null>(null);

  protected readonly form = new FormGroup({
    libelle: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    statut: new FormControl<StatutTableauDeBord>('Inactif', { nonNullable: true }),
    populationId: new FormControl('', { nonNullable: true }),
    modele: new FormControl<ModeleBase>(GABARIT_PAR_DEFAUT as ModeleBase, { nonNullable: true }),
  });
  protected readonly valeur = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue())), { initialValue: this.form.getRawValue() });

  protected readonly statuts: TabItem[] = [
    { id: 'Actif', label: 'Actif' },
    { id: 'Inactif', label: 'Inactif' },
  ];
  protected readonly etapes = computed<StepperItemData[]>(() => [
    { label: 'Information du tableau de bord', status: this.etape() === 1 ? 'current' : 'completed' },
    { label: 'Point de départ', status: this.etape() === 2 ? 'current' : 'upcoming' },
  ]);

  protected readonly populationsFiltrees = computed(() => {
    const q = this.recherche().trim().toLowerCase();
    return this.populations()
      .filter((p) => !q || p.nom.toLowerCase().includes(q))
      .map((p) => ({ ...p, effectif: employesCouverts(p, this.employes()).length }));
  });
  protected readonly populationChoisie = computed(() => this.populations().find((p) => p.id === this.valeur().populationId));
  protected readonly gabaritChoisi = computed(() => this.gabarits().find((g) => g.id === this.valeur().modele));

  protected readonly actionPrincipale = computed<DialogAction>(() => {
    if (this.tableau()) return { label: 'Suivant — Modifier les indicateurs', onClick: () => this.enregistrer() };
    return this.etape() === 1 ? { label: 'Suivant', onClick: () => this.suivant() } : { label: 'Créer et composer', onClick: () => this.enregistrer() };
  });
  /** Deux actions au plus dans le pied de la modale du kit : « Retour » à l'étape 2, la croix fait office d'« Annuler ». */
  protected readonly actionSecondaire = computed<DialogAction>(() =>
    this.etape() === 2 ? { label: 'Retour', onClick: () => this.etape.set(1) } : { label: 'Annuler', onClick: () => this.annule.emit() },
  );

  constructor() {
    // À chaque ouverture : formulaire vierge (création) ou pré-rempli (modification).
    effect(() => {
      if (!this.open()) return;
      const tableau = this.tableau();
      untracked(() => this.initialiser(tableau));
    });
  }

  protected suivant(): void {
    if (this.tableau()) return this.enregistrer();
    if (this.etape1Valide()) this.etape.set(2);
  }

  private enregistrer(): void {
    if (!this.etape1Valide()) return this.etape.set(1);
    const { libelle, description, statut, populationId, modele } = this.form.getRawValue();
    const existant = this.tableau();
    const saisie: TableauDeBordSaisie = { libelle, description, statut: existant?.statut === 'Archivé' && statut === 'Inactif' ? 'Archivé' : statut, populationId };
    const requete = existant ? this.service.update(existant.id, saisie) : this.service.create(saisie, modele);
    requete.subscribe({ next: (t) => this.enregistre.emit(t), error: (e: Error) => this.erreur.set(e.message) });
  }

  private etape1Valide(): boolean {
    this.tentative.set(true);
    const { libelle, populationId } = this.form.getRawValue();
    return !!libelle.trim() && !!populationId;
  }

  private initialiser(tableau: TableauDeBord | null): void {
    this.etape.set(1);
    this.tentative.set(false);
    this.recherche.set('');
    this.erreur.set(null);
    this.form.reset({
      libelle: tableau?.libelle ?? '',
      description: tableau?.description ?? '',
      statut: tableau?.statut === 'Actif' ? 'Actif' : 'Inactif',
      populationId: tableau?.populationId ?? '',
      modele: tableau?.modele ?? (GABARIT_PAR_DEFAUT as ModeleBase),
    });
    forkJoin([this.populationsService.getAll(), this.catalogue.getGabarits()]).subscribe(([populations, gabarits]) => {
      this.populations.set(populations);
      this.gabarits.set(gabarits);
    });
  }
}
