/** Champ d'un employé sur lequel porte une condition de population. */
export type ChampCondition = 'site' | 'structure' | 'departement' | 'statut' | 'filiale' | 'typeContrat' | 'sexe' | 'anciennete';

export type OperateurCondition = 'est' | 'nest_pas';

/** Façon de combiner les conditions d'une population. */
export type Combinaison = 'ET' | 'OU';

/** Condition : le champ de l'employé est (ou n'est pas) l'une des valeurs. */
export interface ConditionPopulation {
  champ: ChampCondition;
  operateur: OperateurCondition;
  valeurs: string[];
}

export interface ReglesPopulation {
  combinaison: Combinaison;
  conditions: ConditionPopulation[];
}

/** Auteur d'un élément de configuration (tableau de bord). */
export interface AuteurPopulation {
  nom: string;
  email: string;
}

export interface Population extends ReglesPopulation {
  id: string;
  nom: string;
  description: string;
}

/** Tableau de bord qui s'appuie sur une population (modale d'impact). */
export interface PopulationUsage {
  id: string;
  libelle: string;
}

/** Données saisies dans le formulaire de création / modification. */
export interface PopulationSaisie extends ReglesPopulation {
  nom: string;
  description: string;
}

export const LIBELLES_CHAMPS: Record<ChampCondition, string> = {
  site: 'Site',
  structure: 'Structure',
  departement: 'Département',
  statut: 'Statut',
  filiale: 'Filiale',
  typeContrat: 'Type de contrat',
  sexe: 'Sexe',
  anciennete: 'Ancienneté',
};

export const LIBELLES_OPERATEURS: Record<OperateurCondition, string> = {
  est: 'Est',
  nest_pas: "N'est pas",
};

/** Condition en clair, ex. « Site est Dakar, Thiès ». */
export function libelleCondition(c: ConditionPopulation): string {
  return `${LIBELLES_CHAMPS[c.champ]} ${LIBELLES_OPERATEURS[c.operateur].toLowerCase()} ${c.valeurs.join(', ')}`;
}
