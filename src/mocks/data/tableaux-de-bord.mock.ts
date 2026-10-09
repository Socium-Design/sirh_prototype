import type { TableauDeBord } from '../../app/products/workspace/modules/tableau-de-bord/models/tableau-de-bord.model';
import { SECTIONS_CATALOGUE } from './indicateurs.mock';
import { SESSION_USER } from './session.mock';

const SESSION = { nom: SESSION_USER.name, email: SESSION_USER.email };
const MOUSSA = { nom: 'Moussa Ndiaye', email: 'moussa.ndiaye@socium.link' };
/** Sections d'un tableau neuf : celles du catalogue, renommables ensuite tableau par tableau. */
const sections = () => SECTIONS_CATALOGUE.map((s) => ({ ...s }));

/**
 * Tableaux de bord du client. Leur population et leur libellé sont cohérents avec les usages de population
 * (`population-usages.mock.ts` : « Dashboard RH Global », « Dashboard masse salariale », « Dashboard effectifs internationaux »).
 */
export const TABLEAUX_DE_BORD: TableauDeBord[] = [
  {
    id: 'tdb-1',
    libelle: 'Dashboard RH Global',
    description: "Vue d'ensemble des effectifs et des mouvements pour l'équipe RH.",
    statut: 'Actif',
    populationId: 'pop-1',
    sections: sections(),
    widgets: [
      { id: 'w-1', indicateurId: 'ind-effectif-total', sectionId: 'effectifs', filtres: [] },
      { id: 'w-2', indicateurId: 'ind-repartition-site', sectionId: 'effectifs', filtres: [] },
      { id: 'w-3', indicateurId: 'ind-repartition-departement', sectionId: 'effectifs', filtres: [] },
      { id: 'w-4', indicateurId: 'ind-repartition-statut', sectionId: 'effectifs', filtres: [] },
      { id: 'w-5', indicateurId: 'ind-evolution-effectif', sectionId: 'mouvements', filtres: [] },
      { id: 'w-6', indicateurId: 'ind-turnover', sectionId: 'mouvements', titre: 'Turnover mensuel', filtres: ['site:Dakar', 'site:Thiès'] },
    ],
    creePar: SESSION,
    creeLe: '2026-05-12',
    previsualise: true,
  },
  {
    id: 'tdb-2',
    libelle: 'Dashboard masse salariale',
    description: 'Suivi de la masse salariale des fonctions support.',
    statut: 'Archivé',
    populationId: 'pop-2',
    sections: sections(),
    widgets: [
      { id: 'w-7', indicateurId: 'ind-masse-salariale', sectionId: 'paie', filtres: [] },
      { id: 'w-8', indicateurId: 'ind-entrees-sorties', sectionId: 'mouvements', filtres: ['departement:Finance'] },
    ],
    creePar: SESSION,
    creeLe: '2026-02-03',
    previsualise: true,
  },
  {
    id: 'tdb-3',
    libelle: 'Dashboard effectifs internationaux',
    description: "Effectifs des filiales de Côte d'Ivoire et de France.",
    statut: 'Actif',
    populationId: 'pop-5',
    sections: sections().map((s) => (s.id === 'effectifs' ? { ...s, libelle: 'Effectifs par pays' } : s)),
    widgets: [
      { id: 'w-9', indicateurId: 'ind-repartition-filiale', sectionId: 'effectifs', filtres: [] },
      { id: 'w-10', indicateurId: 'ind-repartition-site', sectionId: 'effectifs', filtres: ['filiale:France', "filiale:Côte d'Ivoire"] },
      { id: 'w-11', indicateurId: 'ind-entrees-sorties', sectionId: 'mouvements', filtres: [] },
    ],
    creePar: MOUSSA,
    creeLe: '2026-07-08',
    previsualise: true,
  },
  {
    id: 'tdb-4',
    libelle: 'Performance DSI',
    description: 'Campagne d’entretiens et objectifs de la DSI.',
    statut: 'Inactif',
    populationId: 'pop-3',
    sections: sections(),
    widgets: [
      { id: 'w-12', indicateurId: 'ind-entretiens', sectionId: 'performance', filtres: [] },
      { id: 'w-13', indicateurId: 'ind-objectifs', sectionId: 'performance', filtres: [] },
    ],
    creePar: MOUSSA,
    creeLe: '2026-09-30',
    previsualise: false,
  },
];

/** Composition « V0 » proposée par défaut à la création d'un tableau de bord (indicateurs courants). */
export const INDICATEURS_V0: string[] = ['ind-effectif-total', 'ind-repartition-site', 'ind-repartition-statut', 'ind-evolution-effectif', 'ind-turnover'];
