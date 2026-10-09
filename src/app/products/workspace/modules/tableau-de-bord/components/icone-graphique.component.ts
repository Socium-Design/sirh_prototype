import { Component, input } from '@angular/core';
import { LucideChartBar, LucideChartColumn, LucideChartLine, LucideChartPie, LucideHash } from '@lucide/angular';
import type { TypeGraphique } from '../models/graphique.types';

/** Icône du type de graphique (Courbe, Histogramme, Camembert, Barres horiz., Carte KPI), à placer dans un slot d'icône du kit. */
@Component({
  selector: 'app-icone-graphique',
  imports: [LucideChartLine, LucideChartColumn, LucideChartPie, LucideChartBar, LucideHash],
  host: { class: 'contents' },
  template: `
    @switch (type()) {
      @case ('courbe') {
        <svg lucideChartLine class="size-full" [strokeWidth]="1.5" aria-hidden="true"></svg>
      }
      @case ('histogramme') {
        <svg lucideChartColumn class="size-full" [strokeWidth]="1.5" aria-hidden="true"></svg>
      }
      @case ('camembert') {
        <svg lucideChartPie class="size-full" [strokeWidth]="1.5" aria-hidden="true"></svg>
      }
      @case ('barres-horizontales') {
        <svg lucideChartBar class="size-full" [strokeWidth]="1.5" aria-hidden="true"></svg>
      }
      @default {
        <svg lucideHash class="size-full" [strokeWidth]="1.5" aria-hidden="true"></svg>
      }
    }
  `,
})
export class IconeGraphiqueComponent {
  readonly type = input.required<TypeGraphique>();
}
