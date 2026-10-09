import { LIBELLES_ROLES, type RoleDemo } from '../../../../../core/session/session.service';
import type { ReglesPopulation } from '../../configuration/populations/models/population.model';

export type StatutTableauDeBord = 'Actif' | 'Inactif' | 'Archivé';

/** Profils qui consultent un tableau de bord : les rôles de démonstration de la consultation. */
export type Profil = RoleDemo;

export const LIBELLES_PROFILS: Record<Profil, string> = LIBELLES_ROLES;

/** Modèle de base (point de départ) d'un tableau de bord. */
export type ModeleBase = 'vide' | 'direction-generale' | 'admin-rh' | 'manager';

export interface Gabarit {
  id: ModeleBase;
  libelle: string;
  description: string;
  /** Indicateurs ajoutés à la création. */
  indicateurs: string[];
  /** Profils proposés par défaut. */
  profils: Profil[];
}

/** Section d'un tableau de bord : reprend une section du catalogue, renommable pour ce tableau. */
export interface SectionTableau {
  id: string;
  libelle: string;
}

/** Indicateur du catalogue ajouté à un tableau de bord, avec ses personnalisations. */
export interface Widget {
  id: string;
  indicateurId: string;
  /** Titre / description personnalisés ; absents = ceux du catalogue. */
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
  /** Population / scope : périmètre de données de tous les graphes. `null` : population supprimée. */
  populationId: string | null;
  /**
   * Version des règles de la population conservée par ce tableau quand il a été exclu d'une modification de la population
   * (modale d'impact) ; absente = le tableau suit la version courante.
   */
  reglesFigees?: ReglesPopulation;
  modele: ModeleBase;
  profils: Profil[];
  sections: SectionTableau[];
  widgets: Widget[];
  /** Date de création, au format ISO (AAAA-MM-JJ). */
  creeLe: string;
}

/** Informations saisies dans la modale de création / modification. */
export interface TableauDeBordSaisie {
  libelle: string;
  description: string;
  statut: StatutTableauDeBord;
  populationId: string;
}
