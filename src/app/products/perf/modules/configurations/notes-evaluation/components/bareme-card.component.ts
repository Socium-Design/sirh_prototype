import { Component, computed, input, output } from '@angular/core';
import { SocInputNumber, SocSelect, SocSelectableChips, SocSwitch, type SelectOption } from '@socium-design/angular-components';
import { SocLabsSettingsCard, SocLabsSettingsCardAction, SocLabsSettingsCardFootnote } from '../../../../../../shared/labs/labs';
import type { BaremeNote, Decimales, DefinitionNote } from '../../models/bareme.model';
import {
  CHOIX_RAPIDES,
  DENOMINATEUR_MAX,
  DENOMINATEUR_MIN,
  SCORE_APERCU,
  erreurDenominateur,
  estDesactive,
  noteSurBareme,
} from '../../services/bareme';

const OPTIONS_DECIMALES: SelectOption[] = [
  { value: '0', label: '0 décimale (ex : 4/5)' },
  { value: '1', label: '1 décimale (ex : 3,7/5)' },
  { value: '2', label: '2 décimales (ex : 3,67/5)' },
];

/**
 * Carte de barème d'une note (Perfs > Configurations > Notes d'évaluation) : `soc-labs-settings-card` (Labs, GAP-DS
 * design_system_angular#49 : sur-titre, interrupteur d'en-tête, état désactivé, encadré « Règle de calcul »).
 * Présentationnelle : la page possède les valeurs, la carte émet chaque changement (`changer`).
 */
@Component({
  selector: 'app-bareme-card',
  imports: [SocLabsSettingsCard, SocLabsSettingsCardAction, SocLabsSettingsCardFootnote, SocSwitch, SocSelectableChips, SocInputNumber, SocSelect],
  styleUrl: './bareme-card.component.scss',
  template: `
    @let def = definition();
    @let b = bareme();
    <soc-labs-settings-card overline="BARÈME" [title]="def.titre" [disabled]="desactive()" [disabledNote]="def.mentionDesactive" [attr.data-note]="def.id">
      <soc-switch
        socLabsSettingsCardAction
        [label]="def.interrupteur === 'activation' ? 'Activer le barème' : 'Visible sur l’évaluation'"
        [checked]="b.actif"
        (checkedChange)="changer.emit({ actif: $event })"
        data-testid="interrupteur"
      />

      <div class="bareme__groupe">
        <p class="bareme__label" [id]="def.id + '-choix'">Choix rapide</p>
        <div class="bareme__choix" role="group" [attr.aria-labelledby]="def.id + '-choix'">
          @for (n of choix; track n) {
            <soc-selectable-chips size="lg" [label]="'' + n" [selected]="b.denominateur === n" (click)="changer.emit({ denominateur: n })" />
          }
        </div>
      </div>

      <div class="bareme__champs">
        <soc-input-number
          [label]="def.libelleDenominateur"
          required
          [showSteppers]="false"
          [inputAttrs]="attributsDenominateur"
          [value]="b.denominateur"
          (valueChange)="changer.emit({ denominateur: $event })"
          (input)="saisie($event)"
          [error]="!!erreur()"
          [helperText]="erreur() ?? 'Valeur personnalisée acceptée (entier entre 1 et 1000, pas de négatif).'"
          data-testid="denominateur"
        />
        <soc-select
          label="Décimales affichées"
          [options]="optionsDecimales"
          [value]="'' + b.decimales"
          (valueChange)="changer.emit({ decimales: toDecimales($event) })"
          data-testid="decimales"
        />
      </div>

      <div class="bareme__groupe">
        <p class="bareme__label">Aperçu</p>
        <p class="bareme__apercu" data-testid="apercu" aria-live="polite">
          <span>Un score évalué à <strong>{{ score }} %</strong> s'affichera :</span>{{ ' ' }}<span class="bareme__apercu-valeur">{{ apercu() }}</span>
        </p>
      </div>

      <div class="bareme__finalisees">
        <soc-switch
          label="Appliquer aux évaluations déjà finalisées"
          [checked]="b.appliquerAuxFinalisees"
          (checkedChange)="changer.emit({ appliquerAuxFinalisees: $event })"
          data-testid="finalisees"
        />
        <p class="bareme__aide">
          Activé : le nouveau barème s'applique à toutes les évaluations, passées et futures. Désactivé : il s'applique
          uniquement aux nouvelles évaluations.
        </p>
      </div>

      <div socLabsSettingsCardFootnote class="bareme__regle" data-testid="regle">
        <p class="bareme__regle-titre">Règle de calcul</p>
        <p>{{ def.regle }}</p>
      </div>
    </soc-labs-settings-card>
  `,
})
export class BaremeCardComponent {
  readonly definition = input.required<DefinitionNote>();
  readonly bareme = input.required<BaremeNote>();
  readonly changer = output<Partial<BaremeNote>>();

  protected readonly choix = CHOIX_RAPIDES;
  /**
   * Bornes en attributs natifs seulement : avec `[min]`/`[max]`, `soc-input-number` ramène en silence la saisie dans
   * l'intervalle (1001 → 1000), et la règle demande d'afficher l'erreur à la place.
   */
  protected readonly attributsDenominateur = { min: DENOMINATEUR_MIN, max: DENOMINATEUR_MAX, step: 1, inputmode: 'numeric' };
  protected readonly score = SCORE_APERCU;
  protected readonly optionsDecimales = OPTIONS_DECIMALES;

  protected readonly desactive = computed(() => estDesactive(this.definition(), this.bareme()));
  protected readonly erreur = computed(() => (this.desactive() ? null : erreurDenominateur(this.bareme().denominateur)));
  protected readonly apercu = computed(() => {
    const { denominateur, decimales } = this.bareme();
    return erreurDenominateur(denominateur) ? '—' : `${noteSurBareme(SCORE_APERCU, denominateur!, decimales)} / ${denominateur}`;
  });

  /**
   * Aperçu recalculé à chaque frappe : `soc-input-number` n'émet `valueChange` qu'à la validation du champ (`change`),
   * on lit donc l'événement natif `input` qui remonte du champ.
   */
  protected saisie(event: Event): void {
    const champ = event.target as HTMLInputElement | null;
    // Saisie en cours non interprétable (« 2. », « - ») : on attend la suite plutôt que de vider le champ.
    if (!champ || champ.type !== 'number' || champ.validity.badInput) return;
    const valeur = champ.valueAsNumber;
    this.changer.emit({ denominateur: Number.isNaN(valeur) ? null : valeur });
  }

  protected toDecimales(valeur: string | undefined): Decimales {
    return Number(valeur) as Decimales;
  }
}
