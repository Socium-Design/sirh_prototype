import type { Employe } from '../../employes/models/employe.model';
import { LIBELLES_CHAMPS } from '../../configuration/populations/models/population.model';
import type { DonneesGraphique, Indicateur, SerieIndicateur } from '../models/indicateur.model';
import type { SectionTableau, TableauDeBord, Widget } from '../models/tableau-de-bord.model';
import { calculerDonnees, lireFiltre } from './indicateurs-donnees';

/** Widget prêt à afficher : titre et description effectifs, données du graphique, filtres lisibles. */
export interface WidgetVue {
  widget: Widget;
  indicateur: Indicateur;
  titre: string;
  description: string;
  /** Vrai si le titre ou la description diffèrent du catalogue (« Réinitialiser » possible). */
  personnalise: boolean;
  donnees: DonneesGraphique;
  filtres: { valeur: string; libelle: string }[];
}

export interface SectionVue extends SectionTableau {
  widgets: WidgetVue[];
}

/** Libellé lisible d'un filtre `champ:valeur` (ex. « Site : Dakar »). */
export function libelleFiltre(filtre: string): string {
  const { champ, valeur } = lireFiltre(filtre);
  return `${LIBELLES_CHAMPS[champ] ?? champ} : ${valeur}`;
}

export function construireWidget(widget: Widget, indicateur: Indicateur, employes: Employe[], series: SerieIndicateur[]): WidgetVue {
  return {
    widget,
    indicateur,
    titre: widget.titre ?? indicateur.titre,
    description: widget.description ?? indicateur.description,
    personnalise: widget.titre !== undefined || widget.description !== undefined,
    donnees: calculerDonnees(indicateur, employes, widget.filtres, series),
    filtres: widget.filtres.map((f) => ({ valeur: f, libelle: libelleFiltre(f) })),
  };
}

/**
 * Sections d'un tableau de bord avec leurs widgets, dans l'ordre des sections. `inclureVides` : garder les sections sans
 * widget (cibles d'ajout en composition) ; en consultation, elles sont masquées.
 */
export function construireSections(
  tableau: TableauDeBord,
  indicateurs: Indicateur[],
  employes: Employe[],
  series: SerieIndicateur[],
  inclureVides = false,
): SectionVue[] {
  return tableau.sections
    .map((section) => ({
      ...section,
      widgets: tableau.widgets
        .filter((w) => w.sectionId === section.id)
        .flatMap((w) => {
          const indicateur = indicateurs.find((i) => i.id === w.indicateurId);
          return indicateur ? [construireWidget(w, indicateur, employes, series)] : [];
        }),
    }))
    .filter((s) => inclureVides || s.widgets.length > 0);
}
