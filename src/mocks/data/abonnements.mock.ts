import type { Produit } from '../../app/products/workspace/modules/tableau-de-bord/models/tableau-de-bord.model';

/** Produits du SIRH (clés du design system, `soc-app-shell`). */
export const PRODUITS: Produit[] = [
  { id: 'workspace', libelle: 'Workspace' },
  { id: 'perfs', libelle: 'Perf' },
  { id: 'job', libelle: 'Job' },
  { id: 'workflow', libelle: 'Workflow' },
  { id: 'doc', libelle: 'Doc' },
  { id: 'payroll', libelle: 'Payroll' },
];

/** Produits souscrits par le client du prototype : seuls ceux-là peuvent porter un tableau de bord. */
export const PRODUITS_SOUSCRITS: Produit['id'][] = ['workspace', 'perfs', 'workflow', 'doc'];

/**
 * Indicateurs d'options que le client du prototype n'a pas souscrites (Job, Payroll) : ils restent visibles dans la
 * Bibliothèque, avec un cadenas (« Produit non souscrit »), mais ne peuvent pas être ajoutés.
 */
export const INDICATEURS_NON_SOUSCRITS: string[] = ['ind-cout-embauche', 'ind-charges-patronales'];
