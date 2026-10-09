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
 * - `serie` : série fictive (`indicateurs-series.mock.ts`) pour ce que les employés ne permettent pas de calculer.
 */
export type SourceIndicateur =
  | { type: 'effectif' }
  | { type: 'anciennete-moyenne' }
  | { type: 'repartition'; champ: ChampCondition }
  | { type: 'serie'; serieId: string };

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
}

/** Données prêtes à tracer, quel que soit le type de graphique. */
export interface DonneesGraphique {
  libelles: string[];
  series: { libelle: string; valeurs: number[] }[];
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
