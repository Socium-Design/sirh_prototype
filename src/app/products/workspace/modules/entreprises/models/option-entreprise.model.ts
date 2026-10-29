/** Produits qui portent des options (colonne de navigation de « Fonctionnalités et options »). */
export type ProduitOption = 'workspace' | 'recrutement' | 'workflow' | 'performance' | 'doc' | 'payroll';

/**
 * Offre commerciale d'une option. Classement PROVISOIRE, à valider avec les Sales. `null` : sous-option, qui suit
 * l'offre de son parent (pas de tag).
 */
export type OffreOption = 'payant' | 'standard' | 'customisation';

export interface OptionEntreprise {
  id: string;
  produit: ProduitOption;
  libelle: string;
  description: string;
  offre: OffreOption | null;
  /** Option parente (sous-option, désactivée tant que le parent est coupé). */
  parentId?: string;
  /** Ajoutée ces 30 derniers jours : badge « Nouveau · {date} » et filtre « Nouveautés ». */
  nouveau?: boolean;
  /** Date ISO d'ajout de l'option (« Ajoutée le … »). */
  miseEnLigne: string;
}

/** Options activées d'une entreprise et dernière modification enregistrée. */
export interface EtatOptionsEntreprise {
  actives: string[];
  derniereModification: { par: string; le: string };
}
