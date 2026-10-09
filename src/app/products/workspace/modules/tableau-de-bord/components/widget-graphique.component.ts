import { Component, DestroyRef, ElementRef, computed, effect, inject, input, viewChild } from '@angular/core';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
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

Chart.register(BarController, BarElement, LineController, LineElement, PointElement, PieController, DoughnutController, ArcElement, CategoryScale, LinearScale, Filler, Legend, Tooltip);

/** Palette catégorielle : le kit n'a pas de palette data-viz (GAP-DS), on reprend ses couleurs d'accent. */
const PALETTE = ['blue', 'green', 'amber', 'purple', 'orange', 'indigo', 'red', 'lime'];

/**
 * GAP-DS — le design system n'a pas de composant graphique. Solution provisoire : Chart.js, isolé ici.
 * Le jour où le kit fournit un graphique, seul ce composant change (même entrée : type + données).
 */
@Component({
  selector: 'app-widget-graphique',
  styleUrl: './widget-graphique.component.scss',
  template: `
    @if (definition().chartJs) {
      <div class="graphique">
        <canvas #canvas role="img" [attr.aria-label]="resume()"></canvas>
      </div>
      @if (definition().jauge) {
        <p class="graphique__legende" data-testid="jauge">{{ resume() }}</p>
      }
    } @else {
      <p class="graphique__kpi" data-testid="kpi">{{ formater(donnees().valeur ?? 0) }}</p>
      <p class="graphique__legende">{{ donnees().unite }}</p>
    }
  `,
})
export class WidgetGraphiqueComponent {
  readonly type = input.required<TypeGraphique>();
  readonly donnees = input.required<DonneesGraphique>();

  private readonly hote = inject(ElementRef<HTMLElement>);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private graphique?: Chart;

  protected readonly definition = computed(() => TYPES_GRAPHIQUES[this.type()]);

  /** Texte alternatif du graphique (et légende de la jauge). */
  protected readonly resume = computed(() => {
    const d = this.donnees();
    if (this.definition().jauge) {
      const taux = d.max ? Math.round(((d.valeur ?? 0) / d.max) * 100) : 0;
      return `${d.valeur ?? 0} / ${d.max ?? 0} ${d.unite ?? ''} (${taux} %)`.replace('  ', ' ');
    }
    return d.series.map((s) => `${s.libelle} : ${d.libelles.map((l, i) => `${l} ${this.formater(s.valeurs[i])}`).join(', ')}`).join(' ; ');
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

  protected formater(valeur: number): string {
    return valeur.toLocaleString('fr-FR');
  }

  private configuration(): ChartConfiguration | undefined {
    const def = this.definition();
    const d = this.donnees();
    if (!def.chartJs) return undefined;
    const css = getComputedStyle(this.hote.nativeElement);
    const jeton = (nom: string) => css.getPropertyValue(`--bridges-${nom}`).trim();
    const couleurs = PALETTE.map((c) => jeton(`color-accent-${c}-text`));
    const fonds = PALETTE.map((c) => jeton(`color-accent-${c}-bg`));
    const texte = jeton('color-text-secondary');
    const grille = jeton('color-border-subtle');
    Chart.defaults.font.family = jeton('shape-text-body-font') || Chart.defaults.font.family;
    Chart.defaults.color = texte;

    if (def.jauge) {
      const valeur = d.valeur ?? 0;
      const jauge: ChartConfiguration<'doughnut'> = {
        type: 'doughnut',
        data: { labels: ['Réalisé', 'Restant'], datasets: [{ data: [valeur, Math.max(0, (d.max ?? valeur) - valeur)], backgroundColor: [couleurs[0], grille], borderWidth: 0 }] },
        options: { rotation: -90, circumference: 180, cutout: '75%', aspectRatio: 2, plugins: { legend: { display: false }, tooltip: { enabled: false } } },
      };
      return jauge as ChartConfiguration;
    }

    const circulaire = def.chartJs === 'pie' || def.chartJs === 'doughnut';
    const datasets = d.series.map((s, i) => ({
      label: s.libelle,
      data: s.valeurs,
      backgroundColor: circulaire ? couleurs : def.rempli ? fonds[i % PALETTE.length] : couleurs[i % PALETTE.length],
      borderColor: circulaire ? jeton('color-surface-neutral-white') : couleurs[i % PALETTE.length],
      fill: def.rempli,
      tension: 0.3,
    }));
    const axes = { grid: { color: grille }, stacked: def.empile, beginAtZero: true };
    return {
      type: def.chartJs,
      data: { labels: d.libelles, datasets },
      options: {
        aspectRatio: circulaire ? 1.6 : 2,
        indexAxis: def.horizontal ? 'y' : 'x',
        plugins: { legend: { display: circulaire || d.series.length > 1, position: 'bottom' } },
        scales: circulaire ? {} : { x: axes, y: axes },
      },
    } as ChartConfiguration;
  }
}
