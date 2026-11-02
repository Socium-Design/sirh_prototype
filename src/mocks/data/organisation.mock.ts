import type { Affectation, Perimetre, Poste, Structure } from '../../app/products/perf/modules/objectifs/models/organisation.model';
import { EMPLOYES } from './employes.mock';
import { SESSION_USER } from './session.mock';

/**
 * Organigramme fin (directions et leurs sous-structures). Les directions reprennent le champ `structure` de
 * `employes.mock.ts` ; chaque employé est rattaché à une sous-structure d'après son poste.
 */
export const STRUCTURES: Structure[] = [
  { id: 'dsi', nom: "Direction des systèmes d'information" },
  { id: 'dsi-dev', nom: 'Pôle Développement', parentId: 'dsi' },
  { id: 'dsi-produit', nom: 'Pôle Produit et design', parentId: 'dsi' },
  { id: 'drh', nom: 'Direction des ressources humaines' },
  { id: 'drh-talents', nom: 'Pôle Talents et formation', parentId: 'drh' },
  { id: 'drh-paie', nom: 'Pôle Paie et administration', parentId: 'drh' },
  { id: 'daf', nom: 'Direction administrative et financière' },
  { id: 'daf-compta', nom: 'Service Comptabilité', parentId: 'daf' },
  { id: 'daf-cdg', nom: 'Service Contrôle de gestion', parentId: 'daf' },
];

/** Dix postes : les huit de `employes.mock.ts` et deux postes vacants (aucun titulaire). */
export const POSTES_ORGANISATION: Poste[] = [
  { id: 'dev-angular', intitule: 'Développeur Angular' },
  { id: 'chef-projet', intitule: 'Chef de projet' },
  { id: 'designer-ux', intitule: 'Designer UX' },
  { id: 'charge-recrutement', intitule: 'Chargée de recrutement' },
  { id: 'resp-formation', intitule: 'Responsable formation' },
  { id: 'gest-paie', intitule: 'Gestionnaire de paie' },
  { id: 'comptable', intitule: 'Comptable' },
  { id: 'analyste-financier', intitule: 'Analyste financier' },
  { id: 'architecte-cloud', intitule: 'Architecte cloud' },
  { id: 'juriste-social', intitule: 'Juriste en droit social' },
];

/** Poste (intitulé de `employes.mock.ts`) → sous-structure. Les analystes financiers sont au Contrôle de gestion. */
const STRUCTURE_PAR_POSTE: Record<string, string> = {
  'Développeur Angular': 'dsi-dev',
  'Chef de projet': 'dsi-dev',
  'Designer UX': 'dsi-produit',
  'Chargée de recrutement': 'drh-talents',
  'Responsable formation': 'drh-talents',
  'Gestionnaire de paie': 'drh-paie',
  Comptable: 'daf-compta',
  'Analyste financier': 'daf-cdg',
};

/** Ligne hiérarchique : employé → manager. Absatou Diallo (8) manage 2, 10 et 16 ; 2 manage 18, 10 manage 13. */
const MANAGERS: Record<string, string> = { '2': '8', '10': '8', '16': '8', '18': '2', '13': '10' };

export const AFFECTATIONS: Affectation[] = EMPLOYES.map((e) => ({
  employeId: e.id,
  structureId: STRUCTURE_PAR_POSTE[e.poste],
  posteId: POSTES_ORGANISATION.find((p) => p.intitule === e.poste)!.id,
  managerId: MANAGERS[e.id],
}));

/** Utilisateur connecté (Absatou Diallo, employé n° 8). */
export const UTILISATEUR_ID = EMPLOYES.find((e) => `${e.prenom} ${e.nom}` === SESSION_USER.name)!.id;

/**
 * Périmètre de l'utilisateur connecté : DSI et DRH entières, et seulement le Service Comptabilité de la DAF. Le
 * Service Contrôle de gestion (Khady Gueye, Abdoulaye Niang, Boubacar Toure) est hors périmètre : ces employés
 * n'apparaissent jamais dans Perfs > Objectifs.
 */
export const PERIMETRE: Perimetre = {
  utilisateurId: UTILISATEUR_ID,
  structureIds: ['dsi', 'drh', 'daf-compta'],
};
