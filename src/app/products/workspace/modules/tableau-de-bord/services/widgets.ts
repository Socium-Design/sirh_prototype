import type { Employe } from '../../employes/models/employe.model';
import { LIBELLES_CHAMPS, type Population } from '../../configuration/populations/models/population.model';
import { employesCouverts } from '../../configuration/populations/services/population-regles';
import type { DonneesGraphique, Indicateur, SerieIndicateur } from '../models/indicateur.model';
import type { SectionTableau, TableauDeBord, Widget } from '../models/tableau-de-bord.model';
import { calculerDonnees, lireFiltre } from './indicateurs-donnees';

/** Widget prêt à afficher : titre et description effectifs, données du graphique, filtres lisibles. */
export interface WidgetVue {
  widget: Widget;
  indicateur: Indicateur;
  titre: string;
  description: string;
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

/**
 * Employés du périmètre d'un tableau de bord : ceux de sa population (dans la version figée si le tableau a été exclu
 * d'une modification de la population). Sans population, personne.
 */
export function employesDuTableau(tableau: TableauDeBord, populations: Population[], employes: Employe[]): Employe[] {
  const population = populations.find((p) => p.id === tableau.populationId);
  if (!population) return [];
  return employesCouverts(tableau.reglesFigees ?? population, employes);
}

export function construireWidget(widget: Widget, indicateur: Indicateur, employes: Employe[], series: SerieIndicateur[]): WidgetVue {
  return {
    widget,
    indicateur,
    titre: widget.titre ?? indicateur.titre,
    description: widget.description ?? indicateur.description,
    donnees: calculerDonnees(indicateur, employes, widget.filtres, series),
    filtres: widget.filtres.map((f) => ({ valeur: f, libelle: libelleFiltre(f) })),
  };
}

/** Widgets d'un tableau de bord, dans leur ordre d'ajout. */
export function construireWidgets(tableau: TableauDeBord, indicateurs: Indicateur[], employes: Employe[], series: SerieIndicateur[]): WidgetVue[] {
  return tableau.widgets.flatMap((w) => {
    const indicateur = indicateurs.find((i) => i.id === w.indicateurId);
    return indicateur ? [construireWidget(w, indicateur, employes, series)] : [];
  });
}

/** Sections d'un tableau de bord qui contiennent au moins un widget, dans l'ordre des sections. */
export function construireSections(tableau: TableauDeBord, indicateurs: Indicateur[], employes: Employe[], series: SerieIndicateur[]): SectionVue[] {
  const vues = construireWidgets(tableau, indicateurs, employes, series);
  return tableau.sections
    .map((section) => ({ ...section, widgets: vues.filter((v) => v.widget.sectionId === section.id) }))
    .filter((s) => s.widgets.length > 0);
}
