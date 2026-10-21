import { Component, computed, inject, signal } from '@angular/core';
import { LucideChartColumn, LucideCheck, LucideClipboardCheck, LucideClock, LucideDownload } from '@lucide/angular';
import { SocButton, SocButtonRightIcon } from '@socium-design/angular-components';
import { SocLabsIconTile, SocLabsSettingsCard } from '../../../../../shared/labs/labs';
import type { BaremeNote, DerniereModification } from '../models/bareme.model';
import { BaremesService } from '../services/baremes.service';
import { baremeValide, formaterDateModification } from '../services/bareme';
import { BaremeCardComponent } from './components/bareme-card.component';

/** Lignes de la carte « Ce qui sera mis à jour automatiquement ». */
const MISES_A_JOUR = [
  { icone: 'resultats', titre: "Résultats d'évaluation", texte: 'Notes affichées aux managers, employés et RH sur toutes les campagnes, y compris archivées.' },
  { icone: 'kpi', titre: 'Tableaux de bord & KPI', texte: "Moyennes, comparatifs et graphiques recalculés sur la nouvelle échelle au moment de l'affichage." },
  { icone: 'exports', titre: 'Exports Excel / PDF', texte: 'Tout nouvel export utilise le dénominateur en vigueur au moment de la génération.' },
] as const;

/**
 * Perfs > Configurations > Notes d'évaluation : barèmes des 5 notes (finale, potentiel, performance, objectif, compétence),
 * puis ce qui sera mis à jour, puis la barre « Dernière modification · Annuler · Enregistrer ».
 * Les cartes modifient un brouillon ; « Enregistrer » l'envoie au service (→ « Enregistré ✓ », date mise à jour),
 * « Annuler » revient aux dernières valeurs enregistrées.
 */
@Component({
  selector: 'app-notes-evaluation-page',
  imports: [
    BaremeCardComponent,
    SocLabsSettingsCard,
    SocLabsIconTile,
    SocButton,
    SocButtonRightIcon,
    LucideClipboardCheck,
    LucideChartColumn,
    LucideDownload,
    LucideClock,
    LucideCheck,
  ],
  styleUrl: './notes-evaluation-page.component.scss',
  template: `
    <div class="notes">
      @for (definition of definitions; track definition.id) {
        @if (baremeDe(definition.id); as bareme) {
          <app-bareme-card [definition]="definition" [bareme]="bareme" (changer)="changer(definition.id, $event)" />
        }
      }

      <soc-labs-settings-card title="Ce qui sera mis à jour automatiquement" data-testid="mises-a-jour">
        <ul class="maj">
          @for (ligne of misesAJour; track ligne.titre) {
            <li class="maj__ligne">
              <soc-labs-icon-tile [size]="32" decorative>
                @switch (ligne.icone) {
                  @case ('resultats') { <svg lucideClipboardCheck class="size-full" [strokeWidth]="2"></svg> }
                  @case ('kpi') { <svg lucideChartColumn class="size-full" [strokeWidth]="2"></svg> }
                  @default { <svg lucideDownload class="size-full" [strokeWidth]="2"></svg> }
                }
              </soc-labs-icon-tile>
              <p>{{ ligne.titre }} — {{ ligne.texte }}</p>
            </li>
          }
        </ul>
      </soc-labs-settings-card>

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

  protected readonly definitions = this.service.getDefinitions();
  protected readonly misesAJour = MISES_A_JOUR;

  /** Dernières valeurs enregistrées et brouillon en cours. */
  private readonly enregistres = signal<BaremeNote[]>([]);
  protected readonly brouillon = signal<BaremeNote[]>([]);
  protected readonly derniereModification = signal<DerniereModification | undefined>(undefined);
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

  protected changer(id: string, changes: Partial<BaremeNote>): void {
    this.brouillon.update((baremes) => baremes.map((b) => (b.id === id ? { ...b, ...changes } : b)));
    this.enregistre.set(false);
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
