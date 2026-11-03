/** Unité de l'organigramme. Une structure sans parent est une racine ; une sous-structure a un `parentId`. */
export interface Structure {
  id: string;
  nom: string;
  parentId?: string;
}

export interface Poste {
  id: string;
  intitule: string;
}

/** Rattachement d'un employé (de `employes.mock.ts`) dans l'organigramme : structure fine, poste et manager. */
export interface Affectation {
  employeId: string;
  structureId: string;
  posteId: string;
  managerId?: string;
}

/** Périmètre de l'utilisateur connecté : ses structures (sous-structures comprises) et sa ligne hiérarchique. */
export interface Perimetre {
  utilisateurId: string;
  structureIds: string[];
}

/** Employé vu par Perfs : identité + rattachement résolu. */
export interface Collaborateur {
  id: string;
  matricule: string;
  nomComplet: string;
  initiales: string;
  filiale: string;
  structureId: string;
  structure: string;
  posteId: string;
  poste: string;
  managerId?: string;
}

/** Les trois façons de cibler une population (un seul mode à la fois). */
export type ModePopulation = 'personne' | 'structure' | 'poste';

export interface SelectionPopulation {
  mode: ModePopulation;
  ids: string[];
}
