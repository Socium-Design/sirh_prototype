import type { SerieIndicateur } from '../../app/products/workspace/modules/tableau-de-bord/models/indicateur.model';

const MOIS = ['Nov.', 'Déc.', 'Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.'];

/** Séries fictives des indicateurs qui ne se calculent pas à partir des employés (historique, autres produits). */
export const SERIES_INDICATEURS: SerieIndicateur[] = [
  { id: 'evolution-effectif', donnees: { libelles: MOIS, series: [{ libelle: 'Effectif', valeurs: [18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23] }] } },
  {
    id: 'entrees-sorties',
    donnees: {
      libelles: ['T4 2025', 'T1 2026', 'T2 2026', 'T3 2026'],
      series: [
        { libelle: 'Entrées', valeurs: [3, 4, 2, 3] },
        { libelle: 'Sorties', valeurs: [1, 2, 1, 2] },
      ],
    },
  },
  { id: 'turnover', donnees: { libelles: MOIS, series: [{ libelle: 'Turnover (%)', valeurs: [4.2, 3.8, 5.1, 4.6, 3.9, 4.4, 5.3, 4.8, 4.1, 3.6, 4.0, 3.7] }], unite: '%' } },
  { id: 'entretiens', donnees: { libelles: [], series: [], valeur: 16, max: 23, unite: 'entretiens' } },
  {
    id: 'objectifs',
    donnees: { libelles: ['Non démarré', 'En cours', 'Atteint', 'Non atteint'], series: [{ libelle: 'Objectifs', valeurs: [12, 41, 28, 6] }] },
  },
  { id: 'conges', donnees: { libelles: MOIS, series: [{ libelle: 'Demandes', valeurs: [9, 21, 6, 7, 11, 14, 12, 18, 26, 31, 8, 10] }] } },
  { id: 'masse-salariale', donnees: { libelles: MOIS, series: [{ libelle: 'Masse salariale', valeurs: [41, 44, 42, 42, 43, 45, 45, 46, 47, 47, 48, 49] }], unite: 'M FCFA' } },
];
