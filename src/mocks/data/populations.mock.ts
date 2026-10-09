import type { Population } from '../../app/products/workspace/modules/configuration/populations/models/population.model';
import { SESSION_USER } from './session.mock';

const SESSION = { nom: SESSION_USER.name, email: SESSION_USER.email };
const MOUSSA = { nom: 'Moussa Ndiaye', email: 'moussa.ndiaye@socium.link' };
const FATOU = { nom: 'Fatou Ba', email: 'fatou.ba@socium.link' };

/** Populations (groupes d'employés définis par des règles) servant de périmètre aux KPIs, dashboards et modules. */
export const POPULATIONS: Population[] = [
  {
    id: 'pop-1',
    nom: 'Équipe Sénégal',
    description: 'Tous les collaborateurs de la filiale sénégalaise.',
    combinaison: 'ET',
    conditions: [{ champ: 'filiale', operateur: 'est', valeur: 'Sénégal' }],
    creePar: SESSION,
    modifieeLe: '2026-09-14',
  },
  {
    id: 'pop-2',
    nom: 'Fonctions support',
    description: 'Ressources humaines et finance, tous sites confondus.',
    combinaison: 'OU',
    conditions: [
      { champ: 'departement', operateur: 'est', valeur: 'Ressources humaines' },
      { champ: 'departement', operateur: 'est', valeur: 'Finance' },
    ],
    creePar: SESSION,
    modifieeLe: '2026-08-02',
  },
  {
    id: 'pop-3',
    nom: 'DSI actifs hors Paris',
    description: 'Collaborateurs actifs de la DSI, hors site de Paris.',
    combinaison: 'ET',
    conditions: [
      { champ: 'structure', operateur: 'est', valeur: "Direction des systèmes d'information" },
      { champ: 'statut', operateur: 'est', valeur: 'Actif' },
      { champ: 'site', operateur: 'nest_pas', valeur: 'Paris' },
    ],
    creePar: MOUSSA,
    modifieeLe: '2026-07-21',
  },
  {
    id: 'pop-4',
    nom: 'Collaborateurs inactifs',
    description: '',
    combinaison: 'ET',
    conditions: [{ champ: 'statut', operateur: 'est', valeur: 'Inactif' }],
    creePar: SESSION,
    modifieeLe: '2026-06-30',
  },
  {
    id: 'pop-5',
    nom: 'Filiales hors Sénégal',
    description: "Côte d'Ivoire et France.",
    combinaison: 'OU',
    conditions: [
      { champ: 'filiale', operateur: 'est', valeur: "Côte d'Ivoire" },
      { champ: 'filiale', operateur: 'est', valeur: 'France' },
    ],
    creePar: FATOU,
    modifieeLe: '2026-09-28',
  },
  {
    id: 'pop-6',
    nom: 'RH Dakar',
    description: 'Équipe ressources humaines du siège de Dakar.',
    combinaison: 'ET',
    conditions: [
      { champ: 'departement', operateur: 'est', valeur: 'Ressources humaines' },
      { champ: 'site', operateur: 'est', valeur: 'Dakar' },
    ],
    creePar: SESSION,
    modifieeLe: '2026-10-01',
  },
  {
    id: 'pop-7',
    nom: 'Inactifs Dakar',
    description: 'Collaborateurs inactifs du site de Dakar (aucun à ce jour).',
    combinaison: 'ET',
    conditions: [
      { champ: 'statut', operateur: 'est', valeur: 'Inactif' },
      { champ: 'site', operateur: 'est', valeur: 'Dakar' },
    ],
    creePar: SESSION,
    modifieeLe: '2026-10-05',
  },
];
