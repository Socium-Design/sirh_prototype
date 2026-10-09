import type { Population } from '../../app/products/workspace/modules/configuration/populations/models/population.model';

/** Populations (groupes d'employés définis par des conditions) servant de périmètre aux tableaux de bord. */
export const POPULATIONS: Population[] = [
  {
    id: 'pop-1',
    nom: 'Équipe Sénégal',
    description: 'Tous les collaborateurs de la filiale sénégalaise.',
    combinaison: 'ET',
    conditions: [{ champ: 'filiale', operateur: 'est', valeurs: ['Sénégal'] }],
  },
  {
    id: 'pop-2',
    nom: 'Fonctions support',
    description: 'Ressources humaines et finance, tous sites confondus.',
    combinaison: 'OU',
    conditions: [
      { champ: 'departement', operateur: 'est', valeurs: ['Ressources humaines'] },
      { champ: 'structure', operateur: 'est', valeurs: ['Direction administrative et financière'] },
    ],
  },
  {
    id: 'pop-3',
    nom: 'DSI actifs hors Paris',
    description: 'Collaborateurs actifs de la DSI, hors site de Paris.',
    combinaison: 'ET',
    conditions: [
      { champ: 'structure', operateur: 'est', valeurs: ["Direction des systèmes d'information"] },
      { champ: 'statut', operateur: 'est', valeurs: ['Actif'] },
      { champ: 'site', operateur: 'nest_pas', valeurs: ['Paris'] },
    ],
  },
  {
    id: 'pop-4',
    nom: 'Collaborateurs inactifs',
    description: '',
    combinaison: 'ET',
    conditions: [{ champ: 'statut', operateur: 'est', valeurs: ['Inactif'] }],
  },
  {
    id: 'pop-5',
    nom: 'Filiales hors Sénégal',
    description: "Côte d'Ivoire et France.",
    combinaison: 'ET',
    conditions: [{ champ: 'filiale', operateur: 'est', valeurs: ["Côte d'Ivoire", 'France'] }],
  },
  {
    id: 'pop-6',
    nom: 'Managers – périmètre hiérarchique',
    description: 'Collaborateurs en CDI des sites de Dakar et Thiès.',
    combinaison: 'ET',
    conditions: [
      { champ: 'typeContrat', operateur: 'est', valeurs: ['CDI'] },
      { champ: 'site', operateur: 'est', valeurs: ['Dakar', 'Thiès'] },
    ],
  },
  {
    id: 'pop-7',
    nom: 'Inactifs Dakar',
    description: 'Collaborateurs inactifs du site de Dakar (aucun à ce jour).',
    combinaison: 'ET',
    conditions: [
      { champ: 'statut', operateur: 'est', valeurs: ['Inactif'] },
      { champ: 'site', operateur: 'est', valeurs: ['Dakar'] },
    ],
  },
];
