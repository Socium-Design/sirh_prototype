import { Component, computed, effect, input, output, signal } from '@angular/core';
import { SocCheckbox, SocDialog, SocMessage, SocMessageContent, type DialogAction } from '@socium-design/angular-components';
import type { PopulationUsage } from '../models/population.model';

export type ModeImpact = 'modification' | 'suppression';

/**
 * Modale d'impact : liste les tableaux de bord qui utilisent la population, tous cochés par défaut.
 * Émet `confirm` avec les ids cochés — ceux qui reçoivent la modification ou perdent la population (suppression).
 */
@Component({
  selector: 'app-population-impact-dialog',
  imports: [SocDialog, SocCheckbox, SocMessage, SocMessageContent],
  styleUrl: './population-impact-dialog.component.scss',
  template: `
    <soc-dialog [open]="open()" [title]="titre()" [primaryAction]="primaryAction()" [secondaryAction]="secondaryAction" (close)="cancel.emit()">
      <div class="impact">
        <p>« {{ populationNom() }} » est utilisée dans les dashboards suivants. Cochez ceux sur lesquels l'impact s'appliquera.</p>
        <div class="impact__liste">
          @for (usage of usages(); track usage.id) {
            <soc-checkbox [id]="'impact-' + usage.id" [label]="usage.libelle" [checked]="selection().has(usage.id)" (checkedChange)="basculer(usage.id, $event)" />
          }
        </div>
        <p class="impact__compteur" data-testid="compteur-impact">{{ selection().size }} / {{ usages().length }} dashboards sélectionnés</p>
        @if (erreur()) {
          <soc-message variant="inline" status="error"><span socMessageContent>Cochez au moins un dashboard.</span></soc-message>
        }
      </div>
    </soc-dialog>
  `,
})
export class PopulationImpactDialogComponent {
  readonly open = input(false);
  readonly mode = input.required<ModeImpact>();
  readonly populationNom = input.required<string>();
  readonly usages = input.required<PopulationUsage[]>();
  readonly confirm = output<string[]>();
  readonly cancel = output<void>();

  protected readonly selection = signal(new Set<string>());
  protected readonly erreur = signal(false);

  constructor() {
    // À chaque ouverture : tout est coché par défaut.
    effect(() => {
      if (!this.open()) return;
      this.selection.set(new Set(this.usages().map((u) => u.id)));
      this.erreur.set(false);
    });
  }

  protected readonly titre = computed(() => (this.mode() === 'modification' ? 'Modifier la population ?' : 'Supprimer la population ?'));

  protected readonly primaryAction = computed<DialogAction>(() => ({
    label: this.mode() === 'modification' ? 'Appliquer les modifications' : 'Supprimer quand même',
    onClick: () => this.valider(),
  }));
  protected readonly secondaryAction: DialogAction = { label: 'Annuler', onClick: () => this.cancel.emit() };

  protected basculer(id: string, coche: boolean): void {
    const selection = new Set(this.selection());
    if (coche) selection.add(id);
    else selection.delete(id);
    this.selection.set(selection);
    this.erreur.set(false);
  }

  private valider(): void {
    const ids = this.usages().map((u) => u.id).filter((id) => this.selection().has(id));
    if (this.mode() === 'suppression' && !ids.length) {
      this.erreur.set(true);
      return;
    }
    this.confirm.emit(ids);
  }
}
