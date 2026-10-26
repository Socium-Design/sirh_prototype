import { Component, computed, input, output, signal } from '@angular/core';
import {
  LucideChartColumn,
  LucideClipboardCheck,
  LucideDownload,
  LucideFileSpreadsheet,
  LucideFileText,
  LucideGrid3x3,
  LucideIdCard,
  LucideLayoutList,
  LucideListChecks,
  LucideLock,
  LucideRotateCcwClock,
  LucideSend,
  LucideUserRound,
} from '@lucide/angular';
import {
  SocAccordion,
  SocInputNumber,
  SocMessage,
  SocMessageContent,
  SocSelect,
  SocSelectableChips,
  SocSwitch,
  SocTag,
  type SelectOption,
} from '@socium-design/angular-components';
import {
  SocLabsIconTile,
  SocLabsSettingsCard,
  SocLabsSettingsCardAction,
  SocLabsSettingsCardDetails,
  SocLabsSettingsCardFootnote,
  SocLabsSettingsCardTags,
} from '../../../../../../shared/labs/labs';
import type { BaremeNote, Decimales, DefinitionNote } from '../../models/bareme.model';
import {
  CHOIX_RAPIDES,
  DENOMINATEUR_MAX,
  DENOMINATEUR_MIN,
  SCORE_APERCU,
  erreurDenominateur,
  estDesactive,
  estMasqueePourEvalue,
  noteSurBareme,
  resumeBareme,
} from '../../services/bareme';

/** Libellé de l'interrupteur d'en-tête, selon son rôle. */
const LIBELLES_INTERRUPTEUR = {
  visibilite: 'Visible sur l’évaluation',
  confidentialite: "Visible par l'évalué",
  activation: 'Activer le barème',
} as const;

const OPTIONS_DECIMALES: SelectOption[] = [
  { value: '0', label: '0 décimale (ex : 4/5)' },
  { value: '1', label: '1 décimale (ex : 3,7/5)' },
  { value: '2', label: '2 décimales (ex : 3,67/5)' },
];

/**
 * Carte de barème d'une note (Perfs > Configurations > Notes d'évaluation) : `soc-labs-settings-card` (Labs, GAP-DS
 * design_system_angular#49 : sur-titre, interrupteur d'en-tête, état désactivé, encadré « Règle de calcul »).
 * Présentationnelle : la page possède les valeurs et l'ouverture, la carte émet chaque changement (`changer`,
 * `ouvertureChange`). Repliable (design_system_angular#54) : fermée, l'en-tête montre le résumé du barème et un badge
 * « Modifié » / « Erreur » ; une valeur invalide garde la carte ouverte (`lockExpanded`).
 * Sous la règle de calcul, la zone dépliable « Ce qui sera mis à jour » (`soc-accordion` du kit dans le slot
 * `socLabsSettingsCardDetails`, design_system_angular#63) ; fermée par défaut, elle s'ouvre d'elle-même (carte comprise)
 * quand on masque la note Potentiel pour l'évalué, pour montrer l'impact.
 */
@Component({
  selector: 'app-bareme-card',
  imports: [
    SocLabsSettingsCard,
    SocLabsSettingsCardAction,
    SocLabsSettingsCardFootnote,
    SocLabsSettingsCardDetails,
    SocLabsSettingsCardTags,
    SocLabsIconTile,
    SocSwitch,
    SocSelectableChips,
    SocInputNumber,
    SocSelect,
    SocAccordion,
    SocMessage,
    SocMessageContent,
    SocTag,
    LucideClipboardCheck,
    LucideChartColumn,
    LucideDownload,
    LucideGrid3x3,
    LucideLayoutList,
    LucideListChecks,
    LucideSend,
    LucideIdCard,
    LucideUserRound,
    LucideRotateCcwClock,
    LucideFileText,
    LucideFileSpreadsheet,
    LucideLock,
  ],
  styleUrl: './bareme-card.component.scss',
  template: `
    @let def = definition();
    @let b = bareme();
    <soc-labs-settings-card
      overline="BARÈME"
      [title]="def.titre"
      [disabled]="desactive()"
      [disabledNote]="def.mentionDesactive"
      collapsible
      [expanded]="ouverte() || !!erreur()"
      (expandedChange)="ouvertureChange.emit($event)"
      [lockExpanded]="!!erreur()"
      [summary]="resume()"
      [badge]="badge()?.libelle"
      [badgeTone]="badge()?.ton ?? 'information'"
      [attr.data-note]="def.id"
    >
      @if (tag()) {
        <soc-tag socLabsSettingsCardTags color="purple" data-testid="tag">{{ tag() }}</soc-tag>
      }
      <soc-switch
        socLabsSettingsCardAction
        [label]="libelleInterrupteur()"
        [checked]="b.actif"
        (checkedChange)="basculer($event)"
        data-testid="interrupteur"
      />

      @if (masquee()) {
        <soc-message variant="inline" status="info" data-testid="message-confidentialite">
          <span socMessageContent>Les managers et les RH continuent de voir cette note. L'évalué voit un cadenas à la place.</span>
        </soc-message>
      }

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

      <soc-accordion socLabsSettingsCardDetails label="Ce qui sera mis à jour" [(open)]="impactOuvert" data-testid="impact">
        @let masquage = masquee() ? def.masquage : undefined;
        @if (masquage) {
          <p class="maj__titre" data-testid="impact-masque">
            <svg lucideLock class="maj__cadenas" [strokeWidth]="2" aria-hidden="true"></svg>
            Masqué pour l'évalué
          </p>
        }
        <ul class="maj">
          @for (ligne of masquage?.lignes ?? def.misesAJour; track ligne.titre) {
            <li class="maj__ligne">
              <soc-labs-icon-tile [size]="32" decorative>
                @switch (ligne.icone) {
                  @case ('resultats') { <svg lucideClipboardCheck class="size-full" [strokeWidth]="2"></svg> }
                  @case ('kpi') { <svg lucideChartColumn class="size-full" [strokeWidth]="2"></svg> }
                  @case ('ninebox') { <svg lucideGrid3x3 class="size-full" [strokeWidth]="2"></svg> }
                  @case ('section') { <svg lucideLayoutList class="size-full" [strokeWidth]="2"></svg> }
                  @case ('formulaire') { <svg lucideListChecks class="size-full" [strokeWidth]="2"></svg> }
                  @case ('soumission') { <svg lucideSend class="size-full" [strokeWidth]="2"></svg> }
                  @case ('detail') { <svg lucideIdCard class="size-full" [strokeWidth]="2"></svg> }
                  @case ('profil') { <svg lucideUserRound class="size-full" [strokeWidth]="2"></svg> }
                  @case ('historique') { <svg lucideRotateCcwClock class="size-full" [strokeWidth]="2"></svg> }
                  @case ('pdf') { <svg lucideFileText class="size-full" [strokeWidth]="2"></svg> }
                  @case ('excel') { <svg lucideFileSpreadsheet class="size-full" [strokeWidth]="2"></svg> }
                  @default { <svg lucideDownload class="size-full" [strokeWidth]="2"></svg> }
                }
              </soc-labs-icon-tile>
              <p>{{ ligne.titre }}@if (ligne.texte) { — {{ ligne.texte }}}</p>
            </li>
          }
        </ul>
        @if (masquage) {
          <p class="maj__portee">{{ masquage.portee }}</p>
        }
      </soc-accordion>
    </soc-labs-settings-card>
  `,
})
export class BaremeCardComponent {
  readonly definition = input.required<DefinitionNote>();
  readonly bareme = input.required<BaremeNote>();
  /** Carte ouverte (accordéon tenu par la page, non enregistré). Une carte en erreur reste ouverte. */
  readonly ouverte = input(false);
  /** Réglage différent du dernier enregistré : badge « Modifié ». */
  readonly modifie = input(false);
  /** Tag permanent de l'en-tête (feature flag « Confidentialité du potentiel » sur la carte Potentiel). */
  readonly tag = input<string>();
  readonly changer = output<Partial<BaremeNote>>();
  readonly ouvertureChange = output<boolean>();

  protected readonly choix = CHOIX_RAPIDES;
  /**
   * Bornes en attributs natifs seulement : avec `[min]`/`[max]`, `soc-input-number` ramène en silence la saisie dans
   * l'intervalle (1001 → 1000), et la règle demande d'afficher l'erreur à la place.
   */
  protected readonly attributsDenominateur = { min: DENOMINATEUR_MIN, max: DENOMINATEUR_MAX, step: 1, inputmode: 'numeric' };
  protected readonly score = SCORE_APERCU;
  protected readonly optionsDecimales = OPTIONS_DECIMALES;

  /** Zone « Ce qui sera mis à jour » ouverte : fermée par défaut, jamais enregistrée. */
  protected readonly impactOuvert = signal(false);

  protected readonly libelleInterrupteur = computed(() => LIBELLES_INTERRUPTEUR[this.definition().interrupteur]);
  protected readonly masquee = computed(() => estMasqueePourEvalue(this.definition(), this.bareme()));
  protected readonly desactive = computed(() => estDesactive(this.definition(), this.bareme()));
  protected readonly erreur = computed(() => (this.desactive() ? null : erreurDenominateur(this.bareme().denominateur)));
  protected readonly resume = computed(() => resumeBareme(this.definition(), this.bareme()));
  /** « Erreur » l'emporte sur « Modifié ». */
  protected readonly badge = computed<{ libelle: string; ton: 'error' | 'information' } | undefined>(() =>
    this.erreur() ? { libelle: 'Erreur', ton: 'error' } : this.modifie() ? { libelle: 'Modifié', ton: 'information' } : undefined,
  );
  protected readonly apercu = computed(() => {
    const { denominateur, decimales } = this.bareme();
    return erreurDenominateur(denominateur) ? '—' : `${noteSurBareme(SCORE_APERCU, denominateur!, decimales)} / ${denominateur}`;
  });

  /** Masquer la note pour l'évalué ouvre la carte et la zone « Ce qui sera mis à jour », pour montrer l'impact. */
  protected basculer(actif: boolean): void {
    this.changer.emit({ actif });
    if (!actif && this.definition().interrupteur === 'confidentialite') {
      this.impactOuvert.set(true);
      this.ouvertureChange.emit(true);
    }
  }

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
