/**
 * Types de graphiques du catalogue — fichier unique : ajouter un type = une ligne dans `TYPES_GRAPHIQUES`
 * (+ son icône dans `app-icone-graphique` et son rendu dans `app-widget-graphique` s'il n'est pas un graphique Chart.js standard).
 */
export type TypeGraphique = 'courbe' | 'histogramme' | 'camembert' | 'barres-horizontales' | 'kpi';

export interface DefinitionTypeGraphique {
  libelle: string;
  /** Rendu Chart.js ; absent = carte KPI (valeur chiffrée et tendance). */
  chartJs?: 'bar' | 'line' | 'pie';
  /** Barres couchées (axe des catégories vertical). */
  horizontal?: boolean;
}

export const TYPES_GRAPHIQUES: Record<TypeGraphique, DefinitionTypeGraphique> = {
  courbe: { libelle: 'Courbe', chartJs: 'line' },
  histogramme: { libelle: 'Histogramme', chartJs: 'bar' },
  camembert: { libelle: 'Camembert', chartJs: 'pie' },
  'barres-horizontales': { libelle: 'Barres horiz.', chartJs: 'bar', horizontal: true },
  kpi: { libelle: 'Carte KPI' },
};
