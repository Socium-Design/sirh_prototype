import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators, type ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  SocButton,
  SocCheckbox,
  SocInputArea,
  SocInputNumber,
  SocInputText,
  SocMessage,
  SocMessageContent,
  SocMultiSelect,
  SocPageActions,
  SocPageForm,
  SocPageMessage,
  SocSelect,
} from '@socium-design/angular-components';
import { LucideInfo } from '@lucide/angular';
import { startWith } from 'rxjs';
import { SocLabsIconButton, SocLabsPopulationPicker, type LabsPopulationMode, type LabsPopulationPerson } from '../../../../shared/labs/labs';
import type { SaisieObjectif, TypeObjectif } from './models/objectif.model';
import type { ModePopulation } from './models/organisation.model';
import { OBJECTIFS_PATH } from './objectifs.libelles';
import { resoudrePopulation, sousStructures } from './services/objectifs-regles';
import { ObjectifsService } from './services/objectifs.service';
import { OrganisationService } from './services/organisation.service';

export type ModeFormulaire = 'creation' | 'modification';

export const AVERTISSEMENT_SCOPE =
  'Cette liste affiche tous les employés de votre scope ainsi que ceux rattachés à votre ligne hiérarchique (N-1, N-2…).';

/** La fin de période ne peut pas précéder le début. */
function periodeValide(groupe: AbstractControl): ValidationErrors | null {
  const { debut, fin } = groupe.value as { debut: string; fin: string };
  return debut && fin && fin < debut ? { periode: true } : null;
}

/**
 * Création (`/perf/objectifs/nouveau`) et modification (`/perf/objectifs/:id/modifier`) d'un objectif.
 *
 * Création — nouveauté de l'épique « Assigner un objectif par poste ou par structure » : « Population concernée »
 * (personne nommée, structure avec ses sous-structures, ou poste — un seul mode à la fois) remplace « Personnes
 * assignées ». Un objectif est créé pour chaque employé concerné.
 *
 * Modification — comme la prod : la demande est soumise à validation, la population n'est pas modifiable.
 */
@Component({
  selector: 'app-objectif-form-page',
  imports: [
    ReactiveFormsModule, SocPageForm, SocPageMessage, SocPageActions, SocMessage, SocMessageContent, SocInputText, SocInputArea, SocInputNumber,
    SocSelect, SocMultiSelect, SocCheckbox, SocButton, SocLabsPopulationPicker, SocLabsIconButton, LucideInfo,
  ],
  styleUrl: './objectif-form-page.component.scss',
  template: `
    <soc-page-form [title]="titrePage()" description="Veuillez remplir ces informations" [showBack]="true" (back)="annuler()">
      @if (modification()) {
        <!-- « info » et non « warning » : le message « warning » du kit est sous 4,5:1 (GAP-DS design_system_angular#78). -->
        <soc-message socPageMessage variant="inline" status="info" data-testid="bandeau-validation">
          <span socMessageContent>Cette modification sera soumise à validation avant d'être appliquée.</span>
        </soc-message>
      } @else if (parent()) {
        <soc-message socPageMessage variant="inline" status="info" data-testid="bandeau-parent">
          <span socMessageContent>Sous-objectif de « {{ parent()!.titre }} ».</span>
        </soc-message>
      }

      @if (introuvable()) {
        <soc-message variant="banner" status="warning" title="Objectif introuvable">
          <span socMessageContent>Cet objectif n'existe pas ou a été supprimé.</span>
        </soc-message>
      } @else {
        <form class="formulaire" [formGroup]="form" (ngSubmit)="valider()" id="formulaire-objectif">
          <soc-input-text label="Objectif" placeholder="Titre" required formControlName="titre"
            [error]="erreur('titre')" [helperText]="erreur('titre') ? 'Saisissez le titre de l\\'objectif.' : ''" data-testid="titre" />
          <soc-input-area label="Description" placeholder="Description" formControlName="description" />
          <soc-input-area label="Élément de mesure" placeholder="Tapez ici les éléments qui vous permettront de mesurer l'objectif…" formControlName="elementMesure" />

          @if (modification()) {
            <div class="champ">
              <soc-multi-select label="Personnes assignées" required disabled [options]="assigneOptions()" [value]="assigneValeur()" data-testid="personnes-assignees" />
              <p class="avertissement">{{ avertissement }}</p>
            </div>
          } @else {
            <soc-labs-population-picker
              label="Population concernée"
              required
              [modes]="modesPopulation()"
              [(mode)]="modePopulation"
              [(value)]="selection"
              [people]="personnes()"
              [warning]="avertissement"
              [error]="populationTouchee() && population().length === 0"
              emptyText="Aucun employé ne correspond à cette sélection."
              data-testid="population"
            />
          }

          <fieldset class="periode" formGroupName="periode">
            <legend class="periode__titre">Période <span aria-hidden="true" class="obligatoire">*</span><span class="sr-only">(obligatoire)</span></legend>
            <soc-input-text type="date" label="Début" required formControlName="debut" [error]="erreurPeriode('debut')" data-testid="debut" />
            <soc-input-text type="date" label="Fin" required formControlName="fin" [error]="erreurPeriode('fin')"
              [helperText]="form.controls.periode.hasError('periode') ? 'La fin doit suivre le début.' : ''" data-testid="fin" />
          </fieldset>

          <soc-select label="Type d'objectif" placeholder="Type d'objectif" required [options]="types" formControlName="type"
            [error]="erreur('type')" [helperText]="erreur('type') ? 'Choisissez un type.' : ''" data-testid="type" />
          <soc-input-number label="Pondération" required [min]="1" formControlName="ponderation"
            [error]="erreur('ponderation')" [helperText]="erreur('ponderation') ? 'La pondération est au moins 1.' : ''" data-testid="ponderation" />
          @if (quantitatif()) {
            <soc-input-number label="Valeur cible" required [min]="0" [showSteppers]="false" formControlName="valeurCible"
              [error]="erreur('valeurCible')" [helperText]="erreur('valeurCible') ? 'Saisissez la valeur cible.' : ''" data-testid="valeur-cible" />
            <soc-input-number label="Valeur courante" required [min]="0" [showSteppers]="false" formControlName="valeurCourante"
              [error]="erreur('valeurCourante')" [helperText]="erreur('valeurCourante') ? 'Saisissez la valeur courante.' : ''" data-testid="valeur-courante" />
          }
          <div class="evaluer">
            <soc-checkbox label="Objectif à évaluer" formControlName="aEvaluer" data-testid="a-evaluer" />
            <soc-labs-icon-button ariaLabel="À propos de « Objectif à évaluer »" tooltip="L'objectif est pris en compte dans l'évaluation du collaborateur.">
              <svg lucideInfo class="size-full"></svg>
            </soc-labs-icon-button>
          </div>

          @if (modification()) {
            <soc-input-area label="Raison de la modification" required placeholder="Expliquez pourquoi vous modifiez cet objectif"
              formControlName="raison" [error]="erreur('raison')" [helperText]="erreur('raison') ? 'La raison est obligatoire.' : ''" data-testid="raison" />
          }
        </form>
      }

      <button socButton socPageActions variant="secondary" size="lg" type="button" (click)="annuler()">Annuler</button>
      @if (!introuvable()) {
        <button socButton socPageActions size="lg" type="submit" form="formulaire-objectif" [disabled]="!valide()" data-testid="valider">
          {{ modification() ? 'Soumettre la demande' : "Créer l'objectif" }}
        </button>
      }
    </soc-page-form>
  `,
})
export class ObjectifFormPageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ObjectifsService);
  private readonly organisation = inject(OrganisationService);

  protected readonly modification = computed(() => (this.route.snapshot.data['mode'] as ModeFormulaire) === 'modification');
  private readonly objectifId = this.route.snapshot.paramMap.get('id');
  private readonly existant = this.objectifId ? this.service.objectif(this.objectifId) : undefined;
  protected readonly introuvable = computed(() => this.modification() && !this.existant);
  protected readonly parent = computed(() => {
    const id = this.route.snapshot.queryParamMap.get('parent');
    return id ? this.service.objectif(id) : undefined;
  });
  protected readonly titrePage = computed(() =>
    this.modification() ? "Modification d'un objectif" : this.parent() ? "Création d'un sous objectif" : "Création d'un objectif",
  );

  protected readonly avertissement = AVERTISSEMENT_SCOPE;
  protected readonly types = [
    { value: 'QUALITATIVE', label: 'Qualitative' },
    { value: 'QUANTITATIVE', label: 'Quantitative' },
  ];

  protected readonly form = new FormGroup({
    titre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    description: new FormControl('', { nonNullable: true }),
    elementMesure: new FormControl('', { nonNullable: true }),
    periode: new FormGroup(
      {
        debut: new FormControl('', { nonNullable: true, validators: Validators.required }),
        fin: new FormControl('', { nonNullable: true, validators: Validators.required }),
      },
      { validators: periodeValide },
    ),
    type: new FormControl<TypeObjectif | ''>('', { nonNullable: true, validators: Validators.required }),
    valeurCible: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
    valeurCourante: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
    ponderation: new FormControl<number | null>(1, { validators: [Validators.required, Validators.min(1)] }),
    aEvaluer: new FormControl(true, { nonNullable: true }),
    raison: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
  });

  private readonly valeurs = toSignal(this.form.valueChanges.pipe(startWith(this.form.value)), { initialValue: this.form.value });
  private readonly statut = toSignal(this.form.statusChanges.pipe(startWith(this.form.status)), { initialValue: this.form.status });
  protected readonly quantitatif = computed(() => this.valeurs().type === 'QUANTITATIVE');

  // Population concernée (création).
  protected readonly modePopulation = signal<ModePopulation>('personne');
  protected readonly selection = signal<string[]>([]);
  protected readonly populationTouchee = signal(false);
  protected readonly modesPopulation = computed<LabsPopulationMode[]>(() => {
    const collaborateurs = this.organisation.collaborateurs();
    const structures = this.organisation.structures();
    return [
      {
        id: 'personne',
        label: 'Personne nommée',
        fieldLabel: 'Employés',
        placeholder: 'Veuillez renseigner les noms des personnes concernées',
        options: [...collaborateurs].sort((a, b) => a.nomComplet.localeCompare(b.nomComplet, 'fr')).map((c) => ({ value: c.id, label: `${c.matricule} ${c.nomComplet}` })),
      },
      {
        id: 'structure',
        label: 'Structure',
        fieldLabel: 'Structures',
        placeholder: 'Sélectionner des structures',
        hint: 'Les sous-structures sont incluses.',
        // Seules les structures où l'utilisateur voit au moins un employé (« Contrôle de gestion », hors périmètre, n'apparaît pas).
        options: structures
          .filter((s) => collaborateurs.some((c) => sousStructures(structures, s.id).has(c.structureId)))
          .map((s) => ({ value: s.id, label: s.parentId ? `${structures.find((p) => p.id === s.parentId)!.nom} › ${s.nom}` : s.nom })),
      },
      {
        id: 'poste',
        label: 'Poste',
        fieldLabel: 'Postes',
        placeholder: 'Sélectionner des postes',
        options: this.organisation.postes().map((p) => ({ value: p.id, label: p.intitule })),
      },
    ];
  });
  protected readonly population = computed(() =>
    resoudrePopulation({ mode: this.modePopulation(), ids: this.selection() }, this.organisation.collaborateurs(), this.organisation.structures()),
  );
  protected readonly personnes = computed<LabsPopulationPerson[]>(() =>
    this.population().map((c) => ({ id: c.id, initials: c.initiales, name: c.nomComplet, subtitle: c.structure })),
  );

  // Personnes assignées (modification, non modifiable).
  private readonly assigne = this.existant ? this.organisation.collaborateur(this.existant.employeId) : undefined;
  protected readonly assigneOptions = computed(() => (this.assigne ? [{ value: this.assigne.id, label: `${this.assigne.matricule} ${this.assigne.nomComplet}` }] : []));
  protected readonly assigneValeur = computed(() => (this.assigne ? [this.assigne.id] : []));

  protected readonly valide = computed(() => {
    this.valeurs();
    return this.statut() === 'VALID' && (this.modification() || this.population().length > 0);
  });

  constructor() {
    this.form.controls.type.valueChanges.subscribe((type) => this.activerValeurs(type === 'QUANTITATIVE'));
    if (this.modification()) {
      if (this.existant) {
        const o = this.existant;
        this.form.patchValue({
          titre: o.titre,
          description: o.description,
          elementMesure: o.elementMesure,
          periode: { debut: o.debut, fin: o.fin },
          type: o.type,
          valeurCible: o.valeurCible ?? null,
          valeurCourante: o.valeurCourante ?? null,
          ponderation: o.ponderation,
          aEvaluer: o.aEvaluer,
        });
      }
    } else {
      this.form.controls.raison.disable();
      const employe = this.route.snapshot.queryParamMap.get('employe');
      if (employe && this.organisation.collaborateurs().some((c) => c.id === employe)) this.selection.set([employe]);
      const parent = this.parent();
      if (parent) {
        this.form.patchValue({ periode: { debut: parent.debut, fin: parent.fin } });
        if (!employe) this.selection.set([parent.employeId]);
      }
    }
    this.activerValeurs(this.form.controls.type.value === 'QUANTITATIVE');
  }

  protected erreur(nom: 'titre' | 'type' | 'ponderation' | 'valeurCible' | 'valeurCourante' | 'raison'): boolean {
    this.valeurs();
    const c = this.form.controls[nom];
    return c.invalid && c.touched;
  }

  protected erreurPeriode(nom: 'debut' | 'fin'): boolean {
    this.valeurs();
    const groupe = this.form.controls.periode;
    const c = groupe.controls[nom];
    return c.touched && (c.invalid || (nom === 'fin' && groupe.hasError('periode')));
  }

  protected valider(): void {
    this.populationTouchee.set(true);
    if (!this.valide()) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const saisie: SaisieObjectif = {
      titre: v.titre.trim(),
      description: v.description,
      elementMesure: v.elementMesure,
      debut: v.periode.debut,
      fin: v.periode.fin,
      type: v.type as TypeObjectif,
      valeurCible: v.type === 'QUANTITATIVE' ? (v.valeurCible ?? undefined) : undefined,
      valeurCourante: v.type === 'QUANTITATIVE' ? (v.valeurCourante ?? undefined) : undefined,
      ponderation: v.ponderation ?? 1,
      aEvaluer: v.aEvaluer,
    };
    if (this.modification()) {
      this.service.soumettreModification(this.existant!.id, saisie, v.raison.trim());
      this.service.annoncer('Demande de modification soumise à validation.');
      this.router.navigate([OBJECTIFS_PATH, this.existant!.id]);
      return;
    }
    const crees = this.service.creer(saisie, this.population(), this.parent()?.id);
    this.service.annoncer(`Objectif créé pour ${crees.length} employé(s)`);
    if (this.parent()) this.router.navigate([OBJECTIFS_PATH, this.parent()!.id]);
    else this.router.navigateByUrl(OBJECTIFS_PATH);
  }

  protected annuler(): void {
    if (this.modification() && this.existant) this.router.navigate([OBJECTIFS_PATH, this.existant.id]);
    else if (this.parent()) this.router.navigate([OBJECTIFS_PATH, this.parent()!.id]);
    else this.router.navigateByUrl(OBJECTIFS_PATH);
  }

  /** Valeur cible et valeur courante n'existent (et ne sont obligatoires) que pour un objectif quantitatif. */
  private activerValeurs(actif: boolean): void {
    for (const c of [this.form.controls.valeurCible, this.form.controls.valeurCourante]) {
      if (actif) c.enable({ emitEvent: false });
      else c.disable({ emitEvent: false });
    }
    this.form.updateValueAndValidity();
  }
}
