import type { LabsTagColor, LabsTimelineTone } from '../../../../shared/labs/labs';
import type { EtatObjectif, StatutObjectif, TypeEvenement } from './models/objectif.model';

export const OBJECTIFS_PATH = '/perf/objectifs';

/** Onglets de statut de la liste, dans l'ordre de la prod. */
export const ONGLETS_ETAT: Array<{ id: EtatObjectif; libelle: string }> = [
  { id: 'actif', libelle: 'Actifs' },
  { id: 'cloture', libelle: 'Clôturés' },
  { id: 'a_valider', libelle: 'À valider' },
  { id: 'soumis', libelle: 'Soumis à validation' },
];

export const COULEUR_STATUT: Record<StatutObjectif | string, LabsTagColor> = {
  'En cours': 'success',
  Passé: 'neutral',
  'À venir': 'information',
};

export const EVENEMENTS: Record<TypeEvenement, { libelle: string; ton: LabsTimelineTone }> = {
  ajout_soumis: { libelle: 'Ajout soumis', ton: 'warning' },
  ajout_valide: { libelle: 'Ajout validé', ton: 'success' },
  modification_soumise: { libelle: 'Modification soumise', ton: 'warning' },
  mise_a_jour: { libelle: 'Mise à jour', ton: 'information' },
  cloture: { libelle: 'Clôture', ton: 'neutral' },
};

/** Périodes prédéfinies du filtre « Période » (un objectif correspond s'il chevauche la période). */
export const PERIODES: Array<{ id: string; libelle: string; debut: string; fin: string }> = [
  { id: '2026', libelle: 'Année 2026', debut: '2026-01-01', fin: '2026-12-31' },
  { id: 's1-2026', libelle: '1er semestre 2026', debut: '2026-01-01', fin: '2026-06-30' },
  { id: 's2-2026', libelle: '2e semestre 2026', debut: '2026-07-01', fin: '2026-12-31' },
  { id: 't4-2026', libelle: '4e trimestre 2026', debut: '2026-10-01', fin: '2026-12-31' },
  { id: '2027', libelle: 'Année 2027', debut: '2027-01-01', fin: '2027-12-31' },
];

export type VueCollaborateurs = 'tous' | 'recursif' | 'n1' | 'sans' | 'mes';

export const VUES_COLLABORATEURS: Array<{ value: VueCollaborateurs; label: string }> = [
  { value: 'tous', label: 'Tous les collaborateurs' },
  { value: 'recursif', label: 'Récursif' },
  { value: 'n1', label: 'N-1' },
  { value: 'sans', label: 'Sans objectif' },
  { value: 'mes', label: 'Mes objectifs' },
];

export const AIDE_RECURSIF = 'Récursif : vos N-1 et toute leur ligne hiérarchique (N-2, N-3…).';
