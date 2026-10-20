import type { AppShellProduct } from '@socium-design/angular-components';
import type { ChampCondition, ReglesPopulation } from '../../configuration/populations/models/population.model';
import type { StatutDemande } from './workflow.model';

export type StatutTableauDeBord = 'Actif' | 'Inactif' | 'Archivé';

/** Produit du SIRH sur lequel un tableau de bord apparaît. */
export interface Produit {
  id: AppShellProduct;
  libelle: string;
}

/** Modèle de base (point de départ) d'un tableau de bord. */
export type ModeleBase = 'vide' | 'direction-generale' | 'admin-rh' | 'manager';

export interface Gabarit {
  id: ModeleBase;
  libelle: string;
  description: string;
  /** Indicateurs ajoutés à la création. */
  indicateurs: string[];
}

/** Section d'un tableau de bord : reprend une section du catalogue, renommable pour ce tableau. */
export interface SectionTableau {
  id: string;
  libelle: string;
}

/** Statistique de workflow personnalisé : le workflow choisi à l'ajout et les statuts affichés. */
export interface WidgetWorkflow {
  workflowId: string;
  /** Statuts affichés (filtre de la carte) ; vide = tous. */
  statuts: StatutDemande[];
}

/** Indicateur du catalogue ajouté à un tableau de bord, avec ses personnalisations. */
export interface Widget {
  id: string;
  indicateurId: string;
  /** Titre / description personnalisés ; absents = ceux du catalogue. */
  titre?: string;
  description?: string;
  sectionId: string;
  /**
   * Critères de filtre de la carte (Filiale, Site, Département…), choisis dans « Modifier le KPI ». Chaque critère devient
   * une liste déroulante dans la carte (« Site : Tous ») ; la valeur choisie est un état d'affichage, pas enregistré.
   */
  filtres: ChampCondition[];
  /** Filtre « Population » (KPI filtrables par population uniquement). */
  populationId?: string;
  /** Statistique de workflow personnalisé uniquement. */
  workflow?: WidgetWorkflow;
}

export interface TableauDeBord {
  id: string;
  libelle: string;
  description: string;
  statut: StatutTableauDeBord;
  /** Produit sur lequel le tableau de bord apparaît. */
  produit: AppShellProduct;
  /**
   * Population adressée : les personnes qui voient le tableau de bord (comme une liste de diffusion). Les données affichées,
   * elles, suivent le périmètre de la personne qui consulte. `null` : population supprimée.
   */
  populationId: string | null;
  /**
   * Version des règles de la population conservée par ce tableau quand il a été exclu d'une modification de la population
   * (modale d'impact) ; absente = le tableau suit la version courante.
   */
  reglesFigees?: ReglesPopulation;
  modele: ModeleBase;
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
  produit: AppShellProduct;
  populationId: string;
}
