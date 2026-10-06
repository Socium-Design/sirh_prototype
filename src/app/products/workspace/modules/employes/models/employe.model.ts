export type StatutEmploye = 'Actif' | 'Inactif';

export interface Employe {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  poste: string;
  departement: string;
  statut: StatutEmploye;
  /** Date d'entrée, au format ISO (AAAA-MM-JJ). */
  dateEntree: string;
}
