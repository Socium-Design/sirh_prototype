import type { Employe } from '../../employes/models/employe.model';
import type { ChampCondition } from '../../configuration/populations/models/population.model';
import type { DonneesGraphique, Indicateur, SerieIndicateur } from '../models/indicateur.model';

/** Découpe un filtre `<champ>:<valeur>` (la valeur peut contenir « : »). */
export function lireFiltre(filtre: string): { champ: ChampCondition; valeur: string } {
  const i = filtre.indexOf(':');
  return { champ: filtre.slice(0, i) as ChampCondition, valeur: filtre.slice(i + 1) };
}

/** Filtres d'un widget : OU entre valeurs d'un même champ, ET entre champs différents. */
export function filtrerEmployes(employes: Employe[], filtres: string[]): Employe[] {
  const parChamp = new Map<ChampCondition, string[]>();
  for (const f of filtres.map(lireFiltre)) parChamp.set(f.champ, [...(parChamp.get(f.champ) ?? []), f.valeur]);
  return employes.filter((e) => [...parChamp].every(([champ, valeurs]) => valeurs.includes(e[champ])));
}

/**
 * Données d'un indicateur pour un widget. Les indicateurs « effectif » et « répartition » sont recalculés sur les employés
 * (après filtres) ; les séries fictives sont renvoyées telles quelles (leurs filtres sont affichés mais ne changent pas le mock).
 */
export function calculerDonnees(indicateur: Indicateur, employes: Employe[], filtres: string[], series: SerieIndicateur[]): DonneesGraphique {
  const source = indicateur.source;
  const perimetre = filtrerEmployes(employes, filtres);
  switch (source.type) {
    case 'effectif':
      return { libelles: [], series: [], valeur: perimetre.filter((e) => e.statut === 'Actif').length, unite: 'employés' };
    case 'repartition': {
      const comptes = new Map<string, number>();
      for (const e of perimetre) comptes.set(e[source.champ], (comptes.get(e[source.champ]) ?? 0) + 1);
      const libelles = [...comptes.keys()].sort((a, b) => a.localeCompare(b, 'fr'));
      return { libelles, series: [{ libelle: 'Employés', valeurs: libelles.map((l) => comptes.get(l)!) }] };
    }
    case 'serie':
      return structuredClone(series.find((s) => s.id === source.serieId)?.donnees ?? { libelles: [], series: [] });
  }
}
