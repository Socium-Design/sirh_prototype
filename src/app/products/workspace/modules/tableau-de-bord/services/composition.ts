import type { Indicateur } from '../models/indicateur.model';
import type { TableauDeBord, Widget } from '../models/tableau-de-bord.model';

/**
 * Opérations de composition d'un tableau de bord, sur un brouillon : chaque fonction renvoie une copie modifiée,
 * le brouillon n'est enregistré qu'au clic sur « Enregistrer ».
 */

let sequence = 0;
const nouvelId = () => `w-${Date.now().toString(36)}-${++sequence}`;

/** Ajoute un indicateur (une seule fois par tableau), dans la section de l'indicateur. */
export function ajouterWidget(tableau: TableauDeBord, indicateur: Indicateur): TableauDeBord {
  if (tableau.widgets.some((w) => w.indicateurId === indicateur.id)) return tableau;
  const widget: Widget = { id: nouvelId(), indicateurId: indicateur.id, sectionId: indicateur.sectionId, filtres: [] };
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
  changes: { titre: string; description: string; sectionId: string; filtres: string[] },
): TableauDeBord {
  const personnalisation = (valeur: string, parDefaut: string) => {
    const texte = valeur.trim();
    return texte && texte !== parDefaut ? texte : undefined;
  };
  return {
    ...tableau,
    widgets: tableau.widgets.map((w) => {
      if (w.id !== widgetId) return w;
      const { titre: _t, description: _d, ...reste } = w;
      const titre = personnalisation(changes.titre, indicateur.titre);
      const description = personnalisation(changes.description, indicateur.description);
      return { ...reste, ...(titre ? { titre } : {}), ...(description ? { description } : {}), sectionId: changes.sectionId, filtres: [...changes.filtres] };
    }),
  };
}

/** Renomme une section pour ce tableau de bord uniquement ; un nom vide est ignoré. */
export function renommerSection(tableau: TableauDeBord, sectionId: string, libelle: string): TableauDeBord {
  const nom = libelle.trim();
  if (!nom) return tableau;
  return { ...tableau, sections: tableau.sections.map((s) => (s.id === sectionId ? { ...s, libelle: nom } : s)) };
}
