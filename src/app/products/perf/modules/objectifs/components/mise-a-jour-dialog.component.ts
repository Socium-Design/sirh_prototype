import { Component, computed, effect, input, output, signal } from '@angular/core';
import { SocDialog, SocInputNumber, type DialogAction } from '@socium-design/angular-components';
import type { Objectif } from '../models/objectif.model';

/**
 * « Mettre à jour » un objectif : nouvelle progression (qualitatif) ou nouvelle valeur courante (quantitatif). Un
 * objectif à sous-objectifs n'a pas cette action : sa progression se calcule depuis eux.
 */
@Component({
  selector: 'app-mise-a-jour-dialog',
  imports: [SocDialog, SocInputNumber],
  template: `
    <soc-dialog
      [open]="!!objectif()"
      [title]="'Mettre à jour « ' + (objectif()?.titre ?? '') + ' »'"
      [primaryAction]="valider"
      [secondaryAction]="annuler"
      (close)="ferme.emit()"
    >
      @if (objectif(); as o) {
        <soc-input-number
          [label]="quantitatif() ? 'Valeur courante (cible : ' + o.valeurCible + ')' : 'Progression (%)'"
          required
          [min]="0"
          [max]="quantitatif() ? undefined : 100"
          [value]="valeur()"
          (valueChange)="valeur.set($event)"
          [error]="invalide()"
          [helperText]="invalide() ? messageErreur() : ''"
          data-testid="valeur"
        />
      }
    </soc-dialog>
  `,
})
export class MiseAJourDialogComponent {
  /** Objectif à mettre à jour ; `null` = fenêtre fermée. */
  readonly objectif = input<Objectif | null>(null);
  readonly misAJour = output<number>();
  readonly ferme = output<void>();

  protected readonly valeur = signal<number | null>(0);
  protected readonly quantitatif = computed(() => this.objectif()?.type === 'QUANTITATIVE');
  protected readonly invalide = computed(() => {
    const v = this.valeur();
    return v === null || v < 0 || (!this.quantitatif() && v > 100);
  });
  protected readonly messageErreur = computed(() => (this.quantitatif() ? 'Saisissez une valeur positive.' : 'Saisissez une progression entre 0 et 100 %.'));

  protected readonly valider: DialogAction = {
    label: 'Mettre à jour',
    onClick: () => {
      if (!this.invalide()) this.misAJour.emit(this.valeur()!);
    },
  };
  protected readonly annuler: DialogAction = { label: 'Annuler', onClick: () => this.ferme.emit() };

  constructor() {
    effect(() => {
      const o = this.objectif();
      if (o) this.valeur.set(o.type === 'QUANTITATIVE' ? (o.valeurCourante ?? 0) : o.progression);
    });
  }
}
