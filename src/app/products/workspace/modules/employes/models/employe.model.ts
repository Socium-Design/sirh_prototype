export type StatutEmploye = 'Actif' | 'Inactif';

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
  /** Date d'entrée, au format ISO (AAAA-MM-JJ). */
  dateEntree: string;
}
