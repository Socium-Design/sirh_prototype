import type { SerieIndicateur } from '../../app/products/workspace/modules/tableau-de-bord/models/indicateur.model';

const MOIS = ['Nov.', 'Déc.', 'Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.'];

/** Séries fictives des indicateurs qui ne se calculent pas à partir des employés (historique, autres produits). */
export const SERIES_INDICATEURS: SerieIndicateur[] = [
  { id: 'pyramide-ages', donnees: { libelles: ['18-25 ans', '26-35 ans', '36-45 ans', '46-55 ans', '56 ans et +'], series: [{ libelle: 'Collaborateurs', valeurs: [3, 8, 6, 4, 2] }] } },
  { id: 'entonnoir', donnees: { libelles: ['Candidatures', 'Entretiens', 'Offres', 'Embauches'], series: [{ libelle: 'Candidats', valeurs: [184, 46, 12, 9] }] } },
  { id: 'delai-recrutement', donnees: { libelles: [], series: [], valeur: 32, unite: 'jours' } },
  { id: 'cout-embauche', donnees: { libelles: [], series: [], valeur: 1.4, unite: 'M FCFA' } },
  { id: 'turnover', donnees: { libelles: MOIS, series: [{ libelle: 'Turnover (%)', valeurs: [4.2, 3.8, 5.1, 4.6, 3.9, 4.4, 5.3, 4.8, 4.1, 3.6, 4.0, 3.7] }], unite: '%' } },
  {
    id: 'turnover-departement',
    donnees: { libelles: ['Finance', 'Produit', 'Ressources humaines', 'Technologie'], series: [{ libelle: 'Turnover (%)', valeurs: [6.1, 3.2, 4.5, 8.4] }], unite: '%' },
  },
  { id: 'masse-salariale', donnees: { libelles: MOIS, series: [{ libelle: 'Masse salariale (M FCFA)', valeurs: [41, 44, 42, 42, 43, 45, 45, 46, 47, 47, 48, 49] }], unite: 'M FCFA' } },
  {
    id: 'charges-patronales',
    donnees: { libelles: ['Retraite', 'Santé', 'Prestations familiales', 'Accidents du travail'], series: [{ libelle: 'Charges (M FCFA)', valeurs: [5.6, 3.1, 1.8, 0.9] }] },
  },
  {
    id: 'absences-motif',
    donnees: { libelles: ['Maladie', 'Congés payés', 'Formation', 'Événements familiaux', 'Autres'], series: [{ libelle: "Jours d'absence", valeurs: [42, 118, 23, 9, 6] }] },
  },
  { id: 'absenteisme', donnees: { libelles: MOIS, series: [{ libelle: 'Absentéisme (%)', valeurs: [3.1, 3.8, 4.2, 3.6, 3.0, 2.8, 2.6, 2.9, 2.2, 1.9, 2.7, 3.0] }], unite: '%' } },
];
