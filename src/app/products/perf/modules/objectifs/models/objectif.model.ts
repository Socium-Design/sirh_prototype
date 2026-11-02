export type TypeObjectif = 'QUALITATIVE' | 'QUANTITATIVE';

/** Onglet de la liste où se trouve l'objectif. */
export type EtatObjectif = 'actif' | 'cloture' | 'a_valider' | 'soumis';

/** Statut affiché (tag), déduit de la période à la date des données. */
export type StatutObjectif = 'En cours' | 'Passé' | 'À venir';

export type TypeEvenement = 'ajout_soumis' | 'ajout_valide' | 'modification_soumise' | 'mise_a_jour' | 'cloture';

export interface EvenementObjectif {
  id: string;
  type: TypeEvenement;
  /** Date et heure locales, ISO (AAAA-MM-JJTHH:MM). */
  le: string;
  par: string;
  role: string;
  motif?: string;
  details?: Array<{ libelle: string; valeur: string }>;
}

export interface Objectif {
  id: string;
  titre: string;
  description: string;
  elementMesure: string;
  employeId: string;
  /** Période, dates ISO (AAAA-MM-JJ). */
  debut: string;
  fin: string;
  type: TypeObjectif;
  /** Progression saisie (%), pour un objectif qualitatif sans sous-objectif. */
  progression: number;
  valeurCible?: number;
  valeurCourante?: number;
  ponderation: number;
  aEvaluer: boolean;
  origine: 'Objectif libre';
  etat: EtatObjectif;
  parentId?: string;
  historique: EvenementObjectif[];
}

/** Champs saisis dans le formulaire de création / modification. */
export interface SaisieObjectif {
  titre: string;
  description: string;
  elementMesure: string;
  debut: string;
  fin: string;
  type: TypeObjectif;
  valeurCible?: number;
  valeurCourante?: number;
  ponderation: number;
  aEvaluer: boolean;
}
