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

const cleCondition = (c: ConditionPopulation) => `${c.champ}|${c.operateur}|${c.valeur}`;

/** Mêmes conditions (dans n'importe quel ordre) et même combinaison — la combinaison n'importe pas avec une seule condition. */
export function reglesIdentiques(a: ReglesPopulation, b: ReglesPopulation): boolean {
  const ka = new Set(a.conditions.map(cleCondition));
  const kb = new Set(b.conditions.map(cleCondition));
  if (ka.size !== kb.size || [...ka].some((k) => !kb.has(k))) return false;
  return ka.size <= 1 || a.combinaison === b.combinaison;
}

export interface PopulationSimilaire<P> {
  population: P;
  raison: 'criteres-identiques' | 'memes-employes';
}

/**
 * Populations existantes semblables aux règles saisies : critères identiques, ou mêmes employés couverts (ensemble non vide).
 * Sert à une alerte non bloquante avant validation.
 */
export function populationsSimilaires<P extends ReglesPopulation & { id: string }>(
  regles: ReglesPopulation,
  populations: P[],
  employes: Employe[],
  exceptId?: string | null,
): PopulationSimilaire<P>[] {
  if (!regles.conditions.length) return [];
  const ids = (r: ReglesPopulation) => employesCouverts(r, employes).map((e) => e.id).sort().join(',');
  const couverts = ids(regles);
  return populations
    .filter((p) => p.id !== exceptId)
    .flatMap((population): PopulationSimilaire<P>[] => {
      if (reglesIdentiques(regles, population)) return [{ population, raison: 'criteres-identiques' }];
      if (couverts && ids(population) === couverts) return [{ population, raison: 'memes-employes' }];
      return [];
    });
}
