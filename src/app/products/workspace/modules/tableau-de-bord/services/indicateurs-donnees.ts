import { DATE_DONNEES } from '../../../../../../mocks/data/employes.mock';
import { MOIS } from '../../../../../../mocks/data/indicateurs-series.mock';
import type { ChampCondition } from '../../configuration/populations/models/population.model';
import type { Employe } from '../../employes/models/employe.model';
import type { CouleurSerie, DonneesGraphique, Indicateur, SerieIndicateur } from '../models/indicateur.model';
import type { WidgetWorkflow } from '../models/tableau-de-bord.model';
import { LIBELLES_STATUTS_DEMANDE, type StatutDemande, type WorkflowPersonnalise } from '../models/workflow.model';

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

const ANNEE_MS = 365.25 * 24 * 3600 * 1000;

/** Couleur de chaque statut de demande (une couleur par statut dans l'histogramme empilé). */
const COULEURS_STATUTS: Record<StatutDemande, CouleurSerie> = { validee: 'green', refusee: 'red', 'en-attente': 'amber' };

/**
 * Ce qui fait varier les données d'un widget :
 * - `employes` : employés du périmètre (après filtres globaux et filtre « Population » de la carte) ;
 * - `facteur` : part de ce périmètre dans le périmètre de référence, appliquée aux séries fictives (historique, workflows)
 *   pour qu'elles suivent elles aussi les filtres (données fictives) ;
 * - `workflows` : workflows personnalisés du client.
 */
export interface ContexteDonnees {
  employes: Employe[];
  facteur: number;
  workflows: WorkflowPersonnalise[];
}

/** Applique le facteur de périmètre à une valeur fictive (entiers gardés entiers, sinon une décimale). */
function ajuster(valeur: number, facteur: number): number {
  if (facteur === 1) return valeur;
  const v = valeur * facteur;
  return Number.isInteger(valeur) ? Math.round(v) : Math.round(v * 10) / 10;
}

/**
 * Données d'un indicateur pour un widget. Effectif, ancienneté et répartitions sont recalculés sur les employés du périmètre
 * (après filtres) ; les séries fictives sont mises à l'échelle du périmètre (leurs filtres de carte sont affichés mais ne
 * changent pas le mock) ; une statistique de workflow trace les demandes du workflow choisi, par mois et par statut.
 */
export function calculerDonnees(
  indicateur: Indicateur,
  ctx: ContexteDonnees,
  filtres: string[],
  series: SerieIndicateur[],
  workflow?: WidgetWorkflow,
): DonneesGraphique {
  const source = indicateur.source;
  const perimetre = filtrerEmployes(ctx.employes, filtres);
  const tendance = indicateur.tendance;
  switch (source.type) {
    case 'effectif':
      // Le statut (actifs / sortis) est déjà tranché par les filtres globaux : on compte tout le périmètre filtré.
      return { libelles: [], series: [], valeur: perimetre.length, unite: 'collaborateurs', tendance };
    case 'anciennete-moyenne': {
      const reference = new Date(DATE_DONNEES).getTime();
      const total = perimetre.reduce((s, e) => s + (reference - new Date(e.dateEntree).getTime()) / ANNEE_MS, 0);
      return { libelles: [], series: [], valeur: perimetre.length ? Math.round((total / perimetre.length) * 10) / 10 : 0, unite: 'ans', tendance };
    }
    case 'repartition': {
      const comptes = new Map<string, number>();
      for (const e of perimetre) comptes.set(e[source.champ], (comptes.get(e[source.champ]) ?? 0) + 1);
      const libelles = [...comptes.keys()].sort((a, b) => a.localeCompare(b, 'fr'));
      return { libelles, series: [{ libelle: 'Collaborateurs', valeurs: libelles.map((l) => comptes.get(l)!) }] };
    }
    case 'serie': {
      const donnees = structuredClone(series.find((s) => s.id === source.serieId)?.donnees ?? { libelles: [], series: [] });
      donnees.series = donnees.series.map((s) => ({ ...s, valeurs: s.valeurs.map((v) => ajuster(v, ctx.facteur)) }));
      if (donnees.valeur !== undefined) donnees.valeur = ajuster(donnees.valeur, ctx.facteur);
      return tendance ? { ...donnees, tendance } : donnees;
    }
    case 'workflow': {
      const wf = ctx.workflows.find((w) => w.id === workflow?.workflowId);
      if (!wf) return { libelles: MOIS, series: [] };
      const statuts = (Object.keys(LIBELLES_STATUTS_DEMANDE) as StatutDemande[]).filter((s) => !workflow?.statuts.length || workflow.statuts.includes(s));
      return {
        libelles: MOIS,
        series: statuts.map((s) => ({
          libelle: LIBELLES_STATUTS_DEMANDE[s],
          valeurs: wf.demandesParMois[s].map((v) => ajuster(v, ctx.facteur)),
          couleur: COULEURS_STATUTS[s],
        })),
      };
    }
  }
}
