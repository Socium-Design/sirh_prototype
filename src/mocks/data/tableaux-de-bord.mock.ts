import type { TableauDeBord, Widget } from '../../app/products/workspace/modules/tableau-de-bord/models/tableau-de-bord.model';
import { GABARITS } from './gabarits.mock';
import { INDICATEURS, SECTIONS_CATALOGUE } from './indicateurs.mock';

/** Sections d'un tableau : celles du catalogue, renommables ensuite tableau par tableau. */
const sections = () => SECTIONS_CATALOGUE.map((s) => ({ ...s }));

/** Widgets d'un tableau, chacun dans la section de son indicateur. */
const widgets = (tableauId: string, indicateurs: string[]): Widget[] =>
  indicateurs.map((indicateurId, i) => ({
    id: `${tableauId}-w${i + 1}`,
    indicateurId,
    sectionId: INDICATEURS.find((ind) => ind.id === indicateurId)!.sectionId,
    filtres: [],
  }));
const gabarit = (id: string) => GABARITS.find((g) => g.id === id)!.indicateurs;

/**
 * Tableaux de bord du client. Chaque profil de démonstration (Administrateur RH, Manager, Direction générale) a un tableau
 * actif ; leurs populations sont celles de `populations.mock.ts`.
 */
export const TABLEAUX_DE_BORD: TableauDeBord[] = [
  {
    id: 'tdb-1',
    libelle: 'Dashboard RH Global',
    description: "Vue d'ensemble des effectifs, des mouvements et des absences pour l'équipe RH.",
    statut: 'Actif',
    populationId: 'pop-1',
    modele: 'admin-rh',
    profils: ['admin-rh'],
    sections: sections(),
    widgets: widgets('tdb-1', gabarit('admin-rh')).map((w) =>
      w.indicateurId === 'ind-turnover-global' ? { ...w, titre: 'Turnover mensuel', filtres: ['site:Dakar', 'site:Thiès'] } : w,
    ),
    creeLe: '2026-05-12',
  },
  {
    id: 'tdb-2',
    libelle: 'Dashboard Direction Générale',
    description: 'Synthèse mensuelle pour le comité de direction.',
    statut: 'Actif',
    populationId: 'pop-1',
    modele: 'direction-generale',
    profils: ['direction-generale', 'admin-rh'],
    sections: sections(),
    widgets: widgets('tdb-2', gabarit('direction-generale')),
    creeLe: '2026-06-03',
  },
  {
    id: 'tdb-3',
    libelle: 'Dashboard Managers',
    description: 'Effectif, absences et turnover des équipes de Dakar et Thiès.',
    statut: 'Actif',
    populationId: 'pop-6',
    modele: 'manager',
    profils: ['manager'],
    sections: sections().map((s) => (s.id === 'absences' ? { ...s, libelle: 'Absences de mon équipe' } : s)),
    widgets: widgets('tdb-3', gabarit('manager')),
    creeLe: '2026-07-08',
  },
  {
    id: 'tdb-4',
    libelle: 'Dashboard masse salariale',
    description: 'Suivi de la masse salariale des fonctions support.',
    statut: 'Archivé',
    populationId: 'pop-2',
    modele: 'vide',
    profils: ['admin-rh', 'direction-generale'],
    sections: sections(),
    widgets: widgets('tdb-4', ['ind-masse-salariale', 'ind-effectif-total']),
    creeLe: '2026-02-03',
  },
  {
    id: 'tdb-5',
    libelle: 'Dashboard effectifs internationaux',
    description: "Effectifs des filiales de Côte d'Ivoire et de France.",
    statut: 'Inactif',
    populationId: 'pop-5',
    modele: 'admin-rh',
    profils: ['admin-rh'],
    sections: sections(),
    widgets: widgets('tdb-5', ['ind-effectif-total', 'ind-repartition-hf', 'ind-pyramide-ages']),
    creeLe: '2026-09-30',
  },
];
