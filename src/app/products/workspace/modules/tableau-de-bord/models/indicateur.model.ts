import type { ChampCondition } from '../../configuration/populations/models/population.model';
import type { TypeGraphique } from './graphique.types';

/** Section du catalogue (regroupement d'indicateurs). */
export interface SectionCatalogue {
  id: string;
  libelle: string;
}

/**
 * D'où viennent les données d'un indicateur :
 * - `effectif` / `repartition` / `anciennete-moyenne` : calculées sur les employés de la population du tableau (après filtres) ;
 * - `serie` : série fictive (`indicateurs-series.mock.ts`) pour ce que les employés ne permettent pas de calculer ;
 * - `workflow` : demandes du workflow personnalisé choisi à l'ajout (`workflows-personnalises.mock.ts`), par mois et par statut.
 */
export type SourceIndicateur =
  | { type: 'effectif' }
  | { type: 'anciennete-moyenne' }
  | { type: 'repartition'; champ: ChampCondition }
  | { type: 'serie'; serieId: string }
  | { type: 'workflow' };

/** Évolution d'une carte KPI sur la période (« +13 ce mois »). */
export interface Tendance {
  valeur: number;
  periode: string;
  /** Vrai si une hausse est une bonne nouvelle (flèche verte) ; faux pour un turnover, un délai, un coût… */
  hausseFavorable: boolean;
}

/** Indicateur du catalogue — implémenté par les devs, en lecture seule pour le client. */
export interface Indicateur {
  id: string;
  sectionId: string;
  titre: string;
  description: string;
  typeGraphique: TypeGraphique;
  /** Champs sur lesquels un widget de cet indicateur peut être filtré. */
  filtresDisponibles: ChampCondition[];
  source: SourceIndicateur;
  tendance?: Tendance;
  /** Données classifiées sans historisation : affichage temps réel uniquement (avertissement en consultation). */
  classifieNonHistorise?: boolean;
  /** Peut être filtré par population dans « Modifier le KPI » (ex. effectif des « Femmes cadres »). */
  filtrablePopulation?: boolean;
  /**
   * Statistique générique (workflows personnalisés) : ajoutée autant de fois que voulu, chaque ajout demandant un nom et le
   * workflow concerné.
   */
  generique?: boolean;
}

/** Couleur d'une série (accent du kit) : imposée quand elle porte un sens (statut validé / refusé / en attente). */
export type CouleurSerie = 'green' | 'red' | 'amber' | 'blue';

/** Données prêtes à tracer, quel que soit le type de graphique. */
export interface DonneesGraphique {
  libelles: string[];
  series: { libelle: string; valeurs: number[]; couleur?: CouleurSerie }[];
  /** Carte KPI : valeur unique, son unité et sa tendance. */
  valeur?: number;
  unite?: string;
  tendance?: Tendance;
}

/** Série fictive d'un indicateur non calculable depuis les employés. */
export interface SerieIndicateur {
  id: string;
  donnees: DonneesGraphique;
}
