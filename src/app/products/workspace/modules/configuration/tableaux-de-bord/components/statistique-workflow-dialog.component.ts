import { Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SocDialog, SocInputText, SocSelect, type DialogAction, type SelectOption } from '@socium-design/angular-components';
import type { WorkflowPersonnalise } from '../../../tableau-de-bord/models/workflow.model';
import type { ParametresStatistique } from '../../../tableau-de-bord/services/composition';

/**
 * Modale d'ajout d'une « Statistique de workflow personnalisé » : comme les formulaires de workflow sont créés par chaque
 * client, l'utilisateur nomme la statistique (ex. « Demandes de mission ») et choisit le workflow concerné.
 */
@Component({
  selector: 'app-statistique-workflow-dialog',
  imports: [ReactiveFormsModule, SocDialog, SocInputText, SocSelect],
  styles: `.statistique { display: flex; flex-direction: column; gap: var(--bridges-position-gap-lg); }`,
  template: `
    <soc-dialog [open]="open()" title="Ajouter une statistique de workflow" [primaryAction]="ajouter" [secondaryAction]="annuler" (close)="annule.emit()">
      <form class="statistique" [formGroup]="form" (ngSubmit)="valider()">
        <soc-input-text
          formControlName="titre"
          label="Nom de la statistique"
          required
          placeholder="Ex : Demandes de mission"
          [error]="tentative() && !form.controls.titre.value.trim()"
          [helperText]="tentative() && !form.controls.titre.value.trim() ? 'Le nom est obligatoire.' : undefined"
          data-testid="nom-statistique"
        />
        <soc-select
          formControlName="workflowId"
          label="Workflow"
          required
          placeholder="Choisir un workflow personnalisé"
          [options]="options()"
          [error]="tentative() && !form.controls.workflowId.value"
          [helperText]="tentative() && !form.controls.workflowId.value ? 'Choisissez le workflow concerné.' : 'Demandes par mois, une couleur par statut.'"
          data-testid="workflow"
        />
      </form>
    </soc-dialog>
  `,
})
export class StatistiqueWorkflowDialogComponent {
  readonly open = input(false);
  readonly workflows = input.required<WorkflowPersonnalise[]>();
  readonly ajoute = output<ParametresStatistique>();
  readonly annule = output<void>();

  protected readonly tentative = signal(false);
  protected readonly form = new FormGroup({
    titre: new FormControl('', { nonNullable: true }),
    workflowId: new FormControl('', { nonNullable: true }),
  });
  protected readonly options = computed<SelectOption[]>(() => this.workflows().map((w) => ({ value: w.id, label: w.libelle })));

  protected readonly ajouter: DialogAction = { label: 'Ajouter', onClick: () => this.valider() };
  protected readonly annuler: DialogAction = { label: 'Annuler', onClick: () => this.annule.emit() };

  constructor() {
    effect(() => {
      if (!this.open()) return;
      untracked(() => {
        this.tentative.set(false);
        this.form.reset({ titre: '', workflowId: '' });
      });
    });
  }

  protected valider(): void {
    this.tentative.set(true);
    const { titre, workflowId } = this.form.getRawValue();
    if (titre.trim() && workflowId) this.ajoute.emit({ titre: titre.trim(), workflowId });
  }
}
