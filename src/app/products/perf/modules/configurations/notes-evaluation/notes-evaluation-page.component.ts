import { Component, computed, inject, signal } from '@angular/core';
import { LucideCheck, LucideClock } from '@lucide/angular';
import { SocButton, SocButtonRightIcon } from '@socium-design/angular-components';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import type { BaremeNote, DefinitionNote, DerniereModification, NoteId } from '../models/bareme.model';
import { BaremesService } from '../services/baremes.service';
import { baremeValide, formaterDateModification } from '../services/bareme';
import { BaremeCardComponent } from './components/bareme-card.component';

/**
 * Perfs > Configurations > Notes d'évaluation : barèmes des 5 notes (finale, potentiel, performance, objectif, compétence)
 * en cartes repliables, toutes fermées à l'arrivée (« Tout déplier / Tout replier » au-dessus), chacune avec sa zone
 * « Ce qui sera mis à jour », puis la barre « Dernière modification · Annuler · Enregistrer ».
 * Feature flag « Confidentialité du potentiel » : tag dans l'en-tête de la carte Potentiel (masquée par défaut pour
 * l'évalué, voir `BaremesService`).
 * Les cartes modifient un brouillon ; « Enregistrer » l'envoie au service (→ « Enregistré ✓ », date mise à jour),
 * « Annuler » revient aux dernières valeurs enregistrées.
 */
@Component({
  selector: 'app-notes-evaluation-page',
  imports: [
    BaremeCardComponent,
    SocButton,
    SocButtonRightIcon,
    LucideClock,
    LucideCheck,
  ],
  styleUrl: './notes-evaluation-page.component.scss',
  template: `
    <div class="notes">
      <div class="notes__outils">
        <button socButton variant="ghost" data-testid="tout-deplier" (click)="toutBasculer()">{{ toutOuvert() ? 'Tout replier' : 'Tout déplier' }}</button>
      </div>
      @for (definition of definitions; track definition.id) {
        @if (baremeDe(definition.id); as bareme) {
          <app-bareme-card
            [definition]="definition"
            [bareme]="bareme"
            [ouverte]="!!ouvertes()[definition.id]"
            [modifie]="estModifie(definition.id)"
            [tag]="tagDe(definition)"
            (changer)="changer(definition.id, $event)"
            (ouvertureChange)="ouvrir(definition.id, $event)"
          />
        }
      }


      <div class="pied" data-testid="pied">
        @if (derniereModification(); as modif) {
          <p class="pied__modification" data-testid="derniere-modification">
            <svg lucideClock class="pied__icone" [strokeWidth]="1.5" aria-hidden="true"></svg>
            Dernière modification par {{ modif.par }} le {{ date(modif.le) }}
          </p>
        }
        <div class="pied__actions">
          <button socButton variant="secondary" data-testid="annuler" (click)="annuler()">Annuler</button>
          @if (enregistre()) {
            <button socButton variant="secondary" class="enregistre" data-testid="enregistrer" aria-label="Enregistré ✓">
              Enregistré
              <svg lucideCheck socButtonRightIcon class="size-full" [strokeWidth]="2" aria-hidden="true"></svg>
            </button>
          } @else {
            <button socButton data-testid="enregistrer" [disabled]="!valide()" (click)="enregistrer()">Enregistrer</button>
          }
        </div>
      </div>
    </div>
  `,
})
export class NotesEvaluationPageComponent {
  private readonly service = inject(BaremesService);
  private readonly flags = inject(FeatureFlagsService);

  protected readonly definitions = this.service.getDefinitions();
  /** Tag « Confidentialité du potentiel » de la carte Potentiel, flag actif seulement. */
  private readonly tagConfidentialite = this.flags.actif('confidentialite-potentiel') ? this.flags.libelle('confidentialite-potentiel') : undefined;

  /** Dernières valeurs enregistrées et brouillon en cours. */
  private readonly enregistres = signal<BaremeNote[]>([]);
  protected readonly brouillon = signal<BaremeNote[]>([]);
  protected readonly derniereModification = signal<DerniereModification | undefined>(undefined);
  /** Cartes ouvertes : toutes fermées à l'arrivée, plusieurs ouvertes à la fois ; jamais enregistré. */
  protected readonly ouvertes = signal<Partial<Record<NoteId, boolean>>>({});
  protected readonly toutOuvert = computed(() => this.definitions.every((d) => this.ouvertes()[d.id]));
  /** Vrai juste après « Enregistrer », jusqu'à la modification suivante (« Enregistré ✓ »). */
  protected readonly enregistre = signal(false);

  protected readonly valide = computed(() =>
    this.definitions.every((d) => {
      const b = this.baremeDe(d.id);
      return !b || baremeValide(d, b);
    }),
  );

  constructor() {
    this.service.getConfiguration().subscribe((configuration) => this.appliquer(configuration.baremes, configuration.derniereModification));
  }

  protected baremeDe(id: string): BaremeNote | undefined {
    return this.brouillon().find((b) => b.id === id);
  }

  protected tagDe(definition: DefinitionNote): string | undefined {
    return definition.interrupteur === 'confidentialite' ? this.tagConfidentialite : undefined;
  }

  protected estModifie(id: NoteId): boolean {
    return JSON.stringify(this.baremeDe(id)) !== JSON.stringify(this.enregistres().find((b) => b.id === id));
  }

  protected ouvrir(id: NoteId, ouverte: boolean): void {
    this.ouvertes.update((o) => ({ ...o, [id]: ouverte }));
  }

  /** « Tout déplier » / « Tout replier » ; une carte en erreur reste ouverte. */
  protected toutBasculer(): void {
    const ouvrir = !this.toutOuvert();
    this.ouvertes.set(Object.fromEntries(this.definitions.map((d) => [d.id, ouvrir || !baremeValide(d, this.baremeDe(d.id)!)])));
  }

  protected changer(id: NoteId, changes: Partial<BaremeNote>): void {
    this.brouillon.update((baremes) => baremes.map((b) => (b.id === id ? { ...b, ...changes } : b)));
    this.enregistre.set(false);
    // Une carte en erreur reste ouverte (verrouillée par la carte) ; la marquer ouverte ici évite qu'elle se referme
    // d'elle-même une fois la valeur corrigée.
    const definition = this.definitions.find((d) => d.id === id)!;
    if (!baremeValide(definition, this.baremeDe(id)!)) this.ouvrir(id, true);
  }

  protected annuler(): void {
    this.brouillon.set(structuredClone(this.enregistres()));
    this.enregistre.set(false);
  }

  protected enregistrer(): void {
    if (!this.valide()) return;
    this.service.enregistrer(this.brouillon()).subscribe((configuration) => {
      this.appliquer(configuration.baremes, configuration.derniereModification);
      this.enregistre.set(true);
    });
  }

  protected date(iso: string): string {
    return formaterDateModification(iso);
  }

  private appliquer(baremes: BaremeNote[], derniereModification: DerniereModification): void {
    this.enregistres.set(structuredClone(baremes));
    this.brouillon.set(structuredClone(baremes));
    this.derniereModification.set(derniereModification);
  }
}
