import type { Employe } from '../../../employes/models/employe.model';
import type { ChampCondition, ConditionPopulation, ReglesPopulation } from '../models/population.model';

/** Vrai si l'employé satisfait la condition. */
export function respecteCondition(employe: Employe, condition: ConditionPopulation): boolean {
  const egal = employe[condition.champ] === condition.valeur;
  return condition.operateur === 'est' ? egal : !egal;
}

/** Employés couverts par des règles : toutes les conditions (ET) ou au moins une (OU). Sans condition, personne. */
export function employesCouverts(regles: ReglesPopulation, employes: Employe[]): Employe[] {
  const { conditions, combinaison } = regles;
  if (!conditions.length) return [];
  return employes.filter((e) =>
    combinaison === 'ET' ? conditions.every((c) => respecteCondition(e, c)) : conditions.some((c) => respecteCondition(e, c)),
  );
}

/** Valeurs distinctes d'un champ parmi les employés, triées — sert aux listes de valeurs des conditions. */
export function valeursDuChamp(champ: ChampCondition, employes: Employe[]): string[] {
  return [...new Set(employes.map((e) => e[champ]))].sort((a, b) => a.localeCompare(b, 'fr'));
}

/** Copie indépendante de règles (le modèle source ne doit jamais être modifié par la copie). */
export function copierRegles(regles: ReglesPopulation): ReglesPopulation {
  return { combinaison: regles.combinaison, conditions: regles.conditions.map((c) => ({ ...c })) };
}
