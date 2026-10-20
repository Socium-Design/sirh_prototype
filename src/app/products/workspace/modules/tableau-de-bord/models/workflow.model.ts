/** Statut d'une demande de workflow personnalisé. */
export type StatutDemande = 'validee' | 'refusee' | 'en-attente';

export const LIBELLES_STATUTS_DEMANDE: Record<StatutDemande, string> = {
  validee: 'Validée',
  refusee: 'Refusée',
  'en-attente': 'En attente',
};

/** Workflow personnalisé du client (formulaire créé par le client dans Workflow). */
export interface WorkflowPersonnalise {
  id: string;
  libelle: string;
  /** Nombre de demandes par mois et par statut, sur les 12 derniers mois (mêmes mois que les autres séries). */
  demandesParMois: Record<StatutDemande, number[]>;
}
