import type { ChampCondition } from '../../configuration/populations/models/population.model';
import type { TypeGraphique } from './graphique.types';

/** Produits du SIRH auxquels un indicateur peut être rattaché (souscription). */
export type ProduitSirh = 'workspace' | 'perf' | 'workflow' | 'payroll' | 'doc';

export const LIBELLES_PRODUITS: Record<ProduitSirh, string> = {
  workspace: 'Workspace',
  perf: 'Perf',
  workflow: 'Workflow',
  payroll: 'Payroll',
  doc: 'Doc',
};

/** Section du catalogue (regroupement d'indicateurs). */
export interface SectionCatalogue {
  id: string;
  libelle: string;
}

/**
 * D'où viennent les données d'un indicateur :
 * - `effectif` / `repartition` : calculées sur les employés fictifs partagés (après filtres) ;
 * - `serie` : série fictive (`indicateurs-series.mock.ts`) pour ce que les employés ne permettent pas de calculer.
 */
export type SourceIndicateur =
  | { type: 'effectif' }
  | { type: 'repartition'; champ: ChampCondition }
  | { type: 'serie'; serieId: string };

/** Indicateur du catalogue — implémenté par les devs, en lecture seule pour le client. */
export interface Indicateur {
  id: string;
  sectionId: string;
  titre: string;
  /** Une phrase. */
  description: string;
  typeGraphique: TypeGraphique;
  /** Variables / axes, en clair (ex. « X : site · Y : nombre d'employés »). */
  axes: string;
  regleCalcul: string;
  /** Champs sur lesquels un widget de cet indicateur peut être filtré. */
  filtresDisponibles: ChampCondition[];
  produit: ProduitSirh;
  source: SourceIndicateur;
}

/** Données prêtes à tracer, quel que soit le type de graphique. */
export interface DonneesGraphique {
  libelles: string[];
  series: { libelle: string; valeurs: number[] }[];
  /** KPI chiffré / jauge : valeur unique (et maximum pour la jauge). */
  valeur?: number;
  max?: number;
  unite?: string;
}

/** Série fictive d'un indicateur non calculable depuis les employés. */
export interface SerieIndicateur {
  id: string;
  donnees: DonneesGraphique;
}
