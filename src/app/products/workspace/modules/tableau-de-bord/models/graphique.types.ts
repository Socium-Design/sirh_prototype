/**
 * Types de graphiques du catalogue — fichier unique : ajouter un type = une ligne dans `TYPES_GRAPHIQUES`
 * (+ son rendu dans `app-widget-graphique` s'il n'est pas un graphique Chart.js standard).
 */
export type TypeGraphique =
  | 'kpi'
  | 'histogramme'
  | 'barres-horizontales'
  | 'barres-empilees'
  | 'courbe'
  | 'aire'
  | 'secteurs'
  | 'anneau'
  | 'jauge';

export interface DefinitionTypeGraphique {
  libelle: string;
  /** Rendu Chart.js ; absent = rendu sans graphique (KPI chiffré). */
  chartJs?: 'bar' | 'line' | 'pie' | 'doughnut';
  /** Barres couchées (axe des catégories vertical). */
  horizontal?: boolean;
  /** Séries empilées. */
  empile?: boolean;
  /** Courbe remplie sous la ligne. */
  rempli?: boolean;
  /** Demi-anneau à une seule valeur sur un maximum. */
  jauge?: boolean;
}

export const TYPES_GRAPHIQUES: Record<TypeGraphique, DefinitionTypeGraphique> = {
  kpi: { libelle: 'KPI chiffré' },
  histogramme: { libelle: 'Histogramme', chartJs: 'bar' },
  'barres-horizontales': { libelle: 'Barres horizontales', chartJs: 'bar', horizontal: true },
  'barres-empilees': { libelle: 'Barres empilées', chartJs: 'bar', empile: true },
  courbe: { libelle: 'Courbe', chartJs: 'line' },
  aire: { libelle: 'Aire', chartJs: 'line', rempli: true },
  secteurs: { libelle: 'Diagramme circulaire', chartJs: 'pie' },
  anneau: { libelle: 'Anneau', chartJs: 'doughnut' },
  jauge: { libelle: 'Jauge', chartJs: 'doughnut', jauge: true },
};
