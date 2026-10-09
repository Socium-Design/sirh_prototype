import { Injectable, signal } from '@angular/core';

/**
 * Widgets masqués par l'utilisateur (icône œil), par tableau de bord, le temps de la session.
 * Par défaut rien n'est masqué : tous les KPI sont visibles ; l'utilisateur peut tout masquer (« 0 KPI »).
 */
@Injectable({ providedIn: 'root' })
export class WidgetsMasquesService {
  private readonly masques = signal<Record<string, string[]>>({});

  /** Ids des widgets masqués d'un tableau de bord. */
  pour(tableauId: string): string[] {
    return this.masques()[tableauId] ?? [];
  }

  basculer(tableauId: string, widgetId: string): void {
    const actuels = this.pour(tableauId);
    const suivants = actuels.includes(widgetId) ? actuels.filter((id) => id !== widgetId) : [...actuels, widgetId];
    this.masques.update((m) => ({ ...m, [tableauId]: suivants }));
  }

  toutAfficher(tableauId: string): void {
    this.masques.update((m) => ({ ...m, [tableauId]: [] }));
  }
}
