/** Champ d'un employé sur lequel porte une condition de population. */
export type ChampCondition = 'site' | 'departement' | 'structure' | 'statut' | 'filiale';

export type OperateurCondition = 'est' | 'nest_pas';

/** Façon de combiner les conditions d'une population. */
export type Combinaison = 'ET' | 'OU';

export interface ConditionPopulation {
  champ: ChampCondition;
  operateur: OperateurCondition;
  valeur: string;
}

export interface ReglesPopulation {
  combinaison: Combinaison;
  conditions: ConditionPopulation[];
}

export interface AuteurPopulation {
  nom: string;
  email: string;
}

export interface Population extends ReglesPopulation {
  id: string;
  nom: string;
  description: string;
  creePar: AuteurPopulation;
  /** Date de dernière modification, au format ISO (AAAA-MM-JJ). */
  modifieeLe: string;
}

export type TypeUsage = 'Dashboard' | 'Module';

/** Élément (dashboard, module) qui s'appuie sur une population. */
export interface PopulationUsage {
  id: string;
  libelle: string;
  type: TypeUsage;
  produit: string;
  populationId: string;
  /**
   * Version des règles conservée par cet élément quand il a été exclu d'une modification de la population
   * (modale d'impact) ; absent = l'élément suit la version courante.
   */
  versionFigee?: ReglesPopulation;
}

/** Données saisies dans le formulaire de création / modification. */
export interface PopulationSaisie extends ReglesPopulation {
  nom: string;
  description: string;
}

export const LIBELLES_CHAMPS: Record<ChampCondition, string> = {
  site: 'Site',
  departement: 'Département',
  structure: 'Structure',
  statut: 'Statut',
  filiale: 'Filiale',
};

export const LIBELLES_OPERATEURS: Record<OperateurCondition, string> = {
  est: 'Est',
  nest_pas: "N'est pas",
};
