import type { Gabarit } from '../../app/products/workspace/modules/tableau-de-bord/models/tableau-de-bord.model';

/** Points de départ proposés à la création d'un tableau de bord. Le gabarit choisi pré-remplit réellement les graphes. */
export const GABARITS: Gabarit[] = [
  {
    id: 'vide',
    libelle: 'Gabarit vide',
    description: 'Partez de zéro et ajoutez vos graphes depuis la bibliothèque.',
    indicateurs: [],
    profils: [],
  },
  {
    id: 'direction-generale',
    libelle: 'Direction Générale',
    description: 'Vue synthétique pour le comité de direction : effectifs, masse salariale, turnover et absentéisme.',
    indicateurs: ['ind-effectif-total', 'ind-masse-salariale', 'ind-turnover-global', 'ind-repartition-hf', 'ind-taux-absenteisme'],
    profils: ['direction-generale'],
  },
  {
    id: 'admin-rh',
    libelle: 'Admin RH',
    description: 'Pilotage RH complet : capital humain, mouvements, rémunération et absences.',
    indicateurs: [
      'ind-effectif-total',
      'ind-anciennete-moyenne',
      'ind-pyramide-ages',
      'ind-repartition-hf',
      'ind-turnover-global',
      'ind-turnover-departement',
      'ind-masse-salariale',
      'ind-absences-motif',
      'ind-taux-absenteisme',
    ],
    profils: ['admin-rh'],
  },
  {
    id: 'manager',
    libelle: 'Manager',
    description: "Suivi de l'équipe : effectif, absences et turnover de son périmètre.",
    indicateurs: ['ind-effectif-total', 'ind-taux-absenteisme', 'ind-absences-motif', 'ind-turnover-departement'],
    profils: ['manager'],
  },
];

/** Point de départ sélectionné par défaut dans la modale de création. */
export const GABARIT_PAR_DEFAUT = 'direction-generale';
