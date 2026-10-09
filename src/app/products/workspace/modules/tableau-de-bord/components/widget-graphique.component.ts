import { Component, DestroyRef, ElementRef, computed, effect, inject, input, viewChild } from '@angular/core';
import { LucideTrendingDown, LucideTrendingUp } from '@lucide/angular';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PieController,
  PointElement,
  Tooltip,
  type ChartConfiguration,
} from 'chart.js';
import type { DonneesGraphique } from '../models/indicateur.model';
import { TYPES_GRAPHIQUES, type TypeGraphique } from '../models/graphique.types';

Chart.register(BarController, BarElement, LineController, LineElement, PointElement, PieController, ArcElement, CategoryScale, LinearScale, Legend, Tooltip);

/** Palette catégorielle : le kit n'a pas de palette data-viz (GAP-DS), on reprend ses couleurs d'accent. */
const PALETTE = ['blue', 'green', 'amber', 'purple', 'orange', 'indigo', 'red', 'lime'];

export const formaterNombre = (valeur: number): string => valeur.toLocaleString('fr-FR');

/**
 * GAP-DS — le design system n'a pas de composant graphique. Solution provisoire : Chart.js, isolé ici.
 * Le jour où le kit fournit un graphique, seul ce composant change (même entrée : type + données).
 * Carte KPI : valeur chiffrée, unité et tendance (flèche verte si l'évolution est favorable, rouge sinon).
 * `compact` : mini-graphe (composition), sans légende.
 */
@Component({
  selector: 'app-widget-graphique',
  imports: [LucideTrendingUp, LucideTrendingDown],
  styleUrl: './widget-graphique.component.scss',
  host: { '[class.compact]': 'compact()' },
  template: `
    @if (definition().chartJs) {
      <div class="graphique">
        <canvas #canvas role="img" [attr.aria-label]="resume()"></canvas>
      </div>
    } @else {
      <p class="graphique__kpi" data-testid="kpi">
        {{ formater(donnees().valeur ?? 0) }} <span class="graphique__unite">{{ donnees().unite }}</span>
      </p>
      @if (tendance(); as t) {
        <p class="graphique__tendance" [class.graphique__tendance--defavorable]="!t.favorable" data-testid="tendance">
          @if (t.hausse) {
            <svg lucideTrendingUp class="graphique__fleche" [strokeWidth]="2" aria-hidden="true"></svg>
          } @else {
            <svg lucideTrendingDown class="graphique__fleche" [strokeWidth]="2" aria-hidden="true"></svg>
          }
          {{ t.libelle }}
        </p>
      }
    }
  `,
})
export class WidgetGraphiqueComponent {
  readonly type = input.required<TypeGraphique>();
  readonly donnees = input.required<DonneesGraphique>();
  readonly compact = input(false);

  private readonly hote = inject(ElementRef<HTMLElement>);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private graphique?: Chart;

  protected readonly definition = computed(() => TYPES_GRAPHIQUES[this.type()]);

  /** Tendance d'une carte KPI : « +13 ce mois », hausse ou baisse, favorable ou non. */
  protected readonly tendance = computed(() => {
    const t = this.donnees().tendance;
    if (!t) return null;
    const hausse = t.valeur >= 0;
    return { hausse, favorable: hausse === t.hausseFavorable, libelle: `${hausse ? '+' : ''}${formaterNombre(t.valeur)} ${t.periode}` };
  });

  /** Texte alternatif du graphique. */
  protected readonly resume = computed(() => {
    const d = this.donnees();
    return d.series.map((s) => `${s.libelle} : ${d.libelles.map((l, i) => `${l} ${formaterNombre(s.valeurs[i])}`).join(', ')}`).join(' ; ');
  });

  constructor() {
    effect(() => {
      const canvas = this.canvas()?.nativeElement;
      const config = canvas ? this.configuration() : undefined;
      this.graphique?.destroy();
      this.graphique = canvas && config ? new Chart(canvas, config) : undefined;
    });
    inject(DestroyRef).onDestroy(() => this.graphique?.destroy());
  }

  protected formater = formaterNombre;

  private configuration(): ChartConfiguration | undefined {
    const def = this.definition();
    const d = this.donnees();
    const compact = this.compact();
    if (!def.chartJs) return undefined;
    const css = getComputedStyle(this.hote.nativeElement);
    const jeton = (nom: string) => css.getPropertyValue(`--bridges-${nom}`).trim();
    const couleurs = PALETTE.map((c) => jeton(`color-accent-${c}-text`));
    const texte = jeton('color-text-secondary');
    const grille = jeton('color-border-subtle');
    Chart.defaults.font.family = jeton('shape-text-body-font') || Chart.defaults.font.family;
    Chart.defaults.color = texte;

    const circulaire = def.chartJs === 'pie';
    const datasets = d.series.map((s, i) => ({
      label: s.libelle,
      data: s.valeurs,
      backgroundColor: circulaire ? couleurs : couleurs[i % PALETTE.length],
      borderColor: circulaire ? jeton('color-surface-neutral-white') : couleurs[i % PALETTE.length],
      tension: 0.3,
      pointRadius: compact ? 0 : 3,
    }));
    const axes = { grid: { color: grille, display: !compact }, ticks: { display: !compact }, beginAtZero: true };
    return {
      type: def.chartJs,
      data: { labels: d.libelles, datasets },
      options: {
        aspectRatio: compact ? 2.2 : circulaire ? 2 : 2,
        indexAxis: def.horizontal ? 'y' : 'x',
        plugins: { legend: { display: !compact && (circulaire || d.series.length > 1), position: 'bottom' }, tooltip: { enabled: !compact } },
        scales: circulaire ? {} : { x: axes, y: axes },
      },
    } as ChartConfiguration;
  }
}
