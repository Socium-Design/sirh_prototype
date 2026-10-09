import type { AuteurPopulation } from '../../configuration/populations/models/population.model';

export type StatutTableauDeBord = 'Actif' | 'Inactif' | 'Archivé';

/** Section d'un tableau de bord : reprend une section du catalogue, renommable pour ce tableau. */
export interface SectionTableau {
  id: string;
  libelle: string;
}

/** Indicateur du catalogue ajouté à un tableau de bord, avec ses personnalisations. */
export interface Widget {
  id: string;
  indicateurId: string;
  /** Titre / description personnalisés ; absents = ceux du catalogue (« Réinitialiser » les efface). */
  titre?: string;
  description?: string;
  sectionId: string;
  /** Filtres appliqués, au format `<champ>:<valeur>` (ex. `site:Dakar`). */
  filtres: string[];
}

export interface TableauDeBord {
  id: string;
  libelle: string;
  description: string;
  statut: StatutTableauDeBord;
  /** Seule règle d'accès : les employés de cette population voient le tableau de bord. */
  populationId: string;
  sections: SectionTableau[];
  widgets: Widget[];
  creePar: AuteurPopulation;
  /** Date de création, au format ISO (AAAA-MM-JJ). */
  creeLe: string;
  /** Vrai une fois le tableau prévisualisé : condition pour l'activer. */
  previsualise: boolean;
}
