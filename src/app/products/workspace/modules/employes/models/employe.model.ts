export type StatutEmploye = 'Actif' | 'Inactif';
export type Sexe = 'Homme' | 'Femme';

export interface Employe {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  poste: string;
  departement: string;
  /** Unité organisationnelle de rattachement (direction). */
  structure: string;
  site: string;
  /** Filiale (pays) — mêmes libellés que les entreprises de la session. */
  filiale: string;
  statut: StatutEmploye;
  typeContrat: string;
  sexe: Sexe;
  /** Tranche d'ancienneté (« Moins d'1 an », « 1 à 3 ans »…), calculée depuis la date d'entrée. */
  anciennete: string;
  /** Date d'entrée, au format ISO (AAAA-MM-JJ). */
  dateEntree: string;
}
