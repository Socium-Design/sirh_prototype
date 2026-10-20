import type { Employe } from '../../employes/models/employe.model';
import { LIBELLES_CHAMPS, type Population } from '../../configuration/populations/models/population.model';
import { employesCouverts } from '../../configuration/populations/services/population-regles';
import type { DonneesGraphique, Indicateur, SerieIndicateur } from '../models/indicateur.model';
import type { SectionTableau, TableauDeBord, Widget } from '../models/tableau-de-bord.model';
import { LIBELLES_STATUTS_DEMANDE, type WorkflowPersonnalise } from '../models/workflow.model';
import { FILTRES_GLOBAUX_PAR_DEFAUT, appliquerFiltresGlobaux, filtresEnConflit, type FiltresGlobaux } from './filtres-globaux';
import { calculerDonnees, lireFiltre } from './indicateurs-donnees';

/** Widget prêt à afficher : titre et description effectifs, données du graphique, filtres lisibles. */
export interface WidgetVue {
  widget: Widget;
  indicateur: Indicateur;
  titre: string;
  description: string;
  donnees: DonneesGraphique;
  /** Filtres de la carte (champs, population, statuts de demande), lisibles. */
  filtres: { valeur: string; libelle: string }[];
  /** Filtres de la carte non appliqués parce qu'ils contredisent les filtres globaux (le global l'emporte). */
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
 * - `populations` (filtre « Population » d'une carte) et `workflows` (statistiques de workflow personnalisé).
 */
export interface ContexteWidgets {
  employes: Employe[];
  populations: Population[];
  workflows: WorkflowPersonnalise[];
  series: SerieIndicateur[];
  filtresGlobaux?: FiltresGlobaux;
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
  const ignores = filtresEnConflit(widget.filtres, globaux);
  const appliques = widget.filtres.filter((f) => !ignores.includes(f));
  const contexte = { employes: perimetre, facteur: reference ? perimetre.length / reference : 0, workflows: ctx.workflows };
  const workflow = ctx.workflows.find((w) => w.id === widget.workflow?.workflowId);
  return {
    widget,
    indicateur,
    titre: widget.titre ?? indicateur.titre,
    description: widget.description ?? (workflow ? `Demandes « ${workflow.libelle} », par mois et par statut.` : indicateur.description),
    donnees: calculerDonnees(indicateur, contexte, appliques, ctx.series, widget.workflow),
    filtres: [
      ...(population ? [{ valeur: `population:${population.id}`, libelle: `Population : ${population.nom}` }] : []),
      ...(widget.workflow?.statuts ?? []).map((s) => ({ valeur: `statut-demande:${s}`, libelle: `Statut : ${LIBELLES_STATUTS_DEMANDE[s]}` })),
      ...widget.filtres.map((f) => ({ valeur: f, libelle: libelleFiltre(f) })),
    ],
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
