import type { AppIconName } from '@socium-design/angular-components';
import type { ModuleEntreprise } from './entreprise.model';

/** Produits qui portent des options (colonne de navigation de « Fonctionnalités et options »). */
export type ProduitOption = 'workspace' | 'recrutement' | 'workflow' | 'performance' | 'doc' | 'payroll';

/** Produit de la colonne de navigation, avec l'icône de la barre de produits du kit (« Recrutement » → Job). */
export interface ProduitInfo {
  id: ProduitOption;
  libelle: string;
  icone: AppIconName;
}

/** Offre commerciale d'une option (inventaire validé par les Sales), sous-options comprises. */
export type OffreOption = 'payant' | 'standard';

export interface OptionEntreprise {
  id: string;
  produit: ProduitOption;
  libelle: string;
  description: string;
  offre: OffreOption;
  /** Option développée sur mesure pour un client : tag « Customisation client », en plus du tag d'offre. */
  customisationClient?: boolean;
  /** Option parente (sous-option, désactivée tant que le parent est coupé). */
  parentId?: string;
  /**
   * Ce que l'option suppose activé pour l'entreprise : modules souscrits et options. S'il en manque, l'option reste
   * cochable mais affiche une alerte (« Nécessite … Vérifiez avec les Sales. »).
   */
  prerequis?: PrerequisOption;
  /** Ajoutée ces 30 derniers jours : badge « Nouveau · {date} » et filtre « Nouveautés ». */
  nouveau?: boolean;
  /** Date ISO d'ajout de l'option (« Ajoutée le … »). */
  miseEnLigne: string;
}

export interface PrerequisOption {
  modules?: ModuleEntreprise[];
  /** Identifiants d'options (`OptionEntreprise.id`). */
  options?: string[];
}

/** Options activées d'une entreprise et dernière modification enregistrée. */
export interface EtatOptionsEntreprise {
  actives: string[];
  derniereModification: { par: string; le: string };
}
