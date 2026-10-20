import type { Employe } from '../../employes/models/employe.model';
import { LIBELLES_CHAMPS, type ChampCondition, type Population } from '../../configuration/populations/models/population.model';
import { employesCouverts, valeursDuChamp } from '../../configuration/populations/services/population-regles';
import type { DonneesGraphique, Indicateur, SerieIndicateur } from '../models/indicateur.model';
import type { SectionTableau, TableauDeBord, Widget } from '../models/tableau-de-bord.model';
import type { WorkflowPersonnalise } from '../models/workflow.model';
import { FILTRES_GLOBAUX_PAR_DEFAUT, appliquerFiltresGlobaux, filtresEnConflit, type FiltresGlobaux } from './filtres-globaux';
import { calculerDonnees, filtrerEmployes, lireFiltre } from './indicateurs-donnees';

/** Valeur « Tous » d'une liste de critère (aucun filtre sur ce critère). */
export const TOUS = 'tous';

/** Critère de filtre d'une carte, tel qu'affiché : sa liste déroulante (« Site : Tous ») et la valeur choisie. */
export interface CritereVue {
  champ: ChampCondition;
  libelle: string;
  options: { value: string; label: string }[];
  valeur: string;
}

/** Valeurs choisies dans les listes de critères des cartes : par widget, par critère (état d'affichage). */
export type ValeursCriteres = Record<string, Partial<Record<ChampCondition, string>>>;

/** Widget prêt à afficher : titre et description effectifs, données du graphique, critères de filtre de la carte. */
export interface WidgetVue {
  widget: Widget;
  indicateur: Indicateur;
  titre: string;
  description: string;
  donnees: DonneesGraphique;
  /** Listes de critères affichées dans la carte, au-dessus du graphique. */
  criteres: CritereVue[];
  /** Valeurs choisies dans la carte non appliquées parce qu'elles contredisent les filtres globaux (le global l'emporte). */
  filtresIgnores: string[];
}

export interface SectionVue extends SectionTableau {
  widgets: WidgetVue[];
}

/**
 * Ce dont dépendent les données des widgets :
 * - `employes` : périmètre de données de la personne qui consulte (pas la population adressée, qui dit seulement qui voit
 *   le tableau) ;
 * - `filtresGlobaux` : filtres de la consultation ; absents = ceux par défaut (composition, prévisualisation) ;
 * - `populations` (filtre « Population » d'une carte) et `workflows` (statistiques de workflow personnalisé) ;
 * - `valeurs` : valeur choisie dans chaque liste de critère des cartes (absente = « Tous »).
 */
export interface ContexteWidgets {
  employes: Employe[];
  populations: Population[];
  workflows: WorkflowPersonnalise[];
  series: SerieIndicateur[];
  filtresGlobaux?: FiltresGlobaux;
  valeurs?: ValeursCriteres;
}

/** Libellé lisible d'un filtre `champ:valeur` (ex. « Site : Dakar »). */
export function libelleFiltre(filtre: string): string {
  const { champ, valeur } = lireFiltre(filtre);
  return `${LIBELLES_CHAMPS[champ] ?? champ} : ${valeur}`;
}

export function construireWidget(widget: Widget, indicateur: Indicateur, ctx: ContexteWidgets): WidgetVue {
  const globaux = ctx.filtresGlobaux ?? FILTRES_GLOBAUX_PAR_DEFAUT;
  const reference = appliquerFiltresGlobaux(ctx.employes, FILTRES_GLOBAUX_PAR_DEFAUT).length;
  const population = indicateur.filtrablePopulation ? ctx.populations.find((p) => p.id === widget.populationId) : undefined;
  let perimetre = appliquerFiltresGlobaux(ctx.employes, globaux);
  if (population) perimetre = employesCouverts(population, perimetre);
  const choix = ctx.valeurs?.[widget.id] ?? {};
  const choisis = widget.filtres.flatMap((champ) => (choix[champ] && choix[champ] !== TOUS ? [`${champ}:${choix[champ]}`] : []));
  const ignores = filtresEnConflit(choisis, globaux);
  const appliques = choisis.filter((f) => !ignores.includes(f));
  // Les séries fictives suivent la part du périmètre retenue (filtres globaux, population et valeurs choisies dans la carte).
  const retenus = filtrerEmployes(perimetre, appliques).length;
  const contexte = { employes: perimetre, facteur: reference ? retenus / reference : 0, workflows: ctx.workflows };
  const workflow = ctx.workflows.find((w) => w.id === widget.workflow?.workflowId);
  return {
    widget,
    indicateur,
    titre: widget.titre ?? indicateur.titre,
    description: widget.description ?? (workflow ? `Demandes « ${workflow.libelle} », par mois et par statut.` : indicateur.description),
    donnees: calculerDonnees(indicateur, contexte, appliques, ctx.series, widget.workflow),
    criteres: widget.filtres.map((champ) => ({
      champ,
      libelle: LIBELLES_CHAMPS[champ],
      options: [{ value: TOUS, label: 'Tous' }, ...valeursDuChamp(champ, ctx.employes).map((v) => ({ value: v, label: v }))],
      valeur: choix[champ] ?? TOUS,
    })),
    filtresIgnores: ignores.map(libelleFiltre),
  };
}

/** Widgets d'un tableau de bord, dans leur ordre d'ajout. */
export function construireWidgets(tableau: TableauDeBord, indicateurs: Indicateur[], ctx: ContexteWidgets): WidgetVue[] {
  return tableau.widgets.flatMap((w) => {
    const indicateur = indicateurs.find((i) => i.id === w.indicateurId);
    return indicateur ? [construireWidget(w, indicateur, ctx)] : [];
  });
}

/** Sections d'un tableau de bord qui contiennent au moins un widget, dans l'ordre des sections. */
export function construireSections(tableau: TableauDeBord, indicateurs: Indicateur[], ctx: ContexteWidgets): SectionVue[] {
  const vues = construireWidgets(tableau, indicateurs, ctx);
  return tableau.sections
    .map((section) => ({ ...section, widgets: vues.filter((v) => v.widget.sectionId === section.id) }))
    .filter((s) => s.widgets.length > 0);
}
