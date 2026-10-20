import type { Indicateur } from '../models/indicateur.model';
import type { TableauDeBord, Widget, WidgetWorkflow } from '../models/tableau-de-bord.model';
import type { StatutDemande } from '../models/workflow.model';

/**
 * Opérations de composition d'un tableau de bord, sur un brouillon : chaque fonction renvoie une copie modifiée,
 * le brouillon n'est enregistré qu'au clic sur « Enregistrer ».
 */

let sequence = 0;
const nouvelId = () => `w-${Date.now().toString(36)}-${++sequence}`;

/** Ce que l'on demande à l'ajout d'une statistique générique (workflow personnalisé) : son nom et son workflow. */
export interface ParametresStatistique {
  titre: string;
  workflowId: string;
}

/**
 * Ajoute un indicateur dans la section de l'indicateur : une seule fois par tableau, sauf une statistique générique
 * (workflow personnalisé), ajoutée autant de fois que voulu avec son nom et son workflow.
 */
export function ajouterWidget(tableau: TableauDeBord, indicateur: Indicateur, parametres?: ParametresStatistique): TableauDeBord {
  if (indicateur.generique) {
    if (!parametres?.titre.trim() || !parametres.workflowId) return tableau;
  } else if (tableau.widgets.some((w) => w.indicateurId === indicateur.id)) return tableau;
  const widget: Widget = { id: nouvelId(), indicateurId: indicateur.id, sectionId: indicateur.sectionId, filtres: [] };
  if (indicateur.generique && parametres) {
    widget.titre = parametres.titre.trim();
    widget.workflow = { workflowId: parametres.workflowId, statuts: [] };
  }
  return { ...tableau, widgets: [...tableau.widgets, widget] };
}

export function retirerWidget(tableau: TableauDeBord, widgetId: string): TableauDeBord {
  return { ...tableau, widgets: tableau.widgets.filter((w) => w.id !== widgetId) };
}

/**
 * Personnalise un widget. Un titre ou une description identiques au catalogue (ou vides) ne sont pas stockés :
 * le widget garde ceux du catalogue.
 */
export function modifierWidget(
  tableau: TableauDeBord,
  widgetId: string,
  indicateur: Indicateur,
  changes: { titre: string; description: string; sectionId: string; filtres: string[]; populationId?: string; statuts?: StatutDemande[] },
): TableauDeBord {
  const personnalisation = (valeur: string, parDefaut: string) => {
    const texte = valeur.trim();
    return texte && texte !== parDefaut ? texte : undefined;
  };
  return {
    ...tableau,
    widgets: tableau.widgets.map((w) => {
      if (w.id !== widgetId) return w;
      const { titre: _t, description: _d, populationId: _p, ...reste } = w;
      const titre = personnalisation(changes.titre, indicateur.titre);
      const description = personnalisation(changes.description, indicateur.description);
      const populationId = indicateur.filtrablePopulation ? changes.populationId || undefined : undefined;
      const workflow: WidgetWorkflow | undefined = w.workflow && { ...w.workflow, statuts: [...(changes.statuts ?? w.workflow.statuts)] };
      return {
        ...reste,
        ...(titre ? { titre } : {}),
        ...(description ? { description } : {}),
        ...(populationId ? { populationId } : {}),
        ...(workflow ? { workflow } : {}),
        sectionId: changes.sectionId,
        filtres: [...changes.filtres],
      };
    }),
  };
}

/** Renomme une section pour ce tableau de bord uniquement ; un nom vide est ignoré. */
export function renommerSection(tableau: TableauDeBord, sectionId: string, libelle: string): TableauDeBord {
  const nom = libelle.trim();
  if (!nom) return tableau;
  return { ...tableau, sections: tableau.sections.map((s) => (s.id === sectionId ? { ...s, libelle: nom } : s)) };
}
