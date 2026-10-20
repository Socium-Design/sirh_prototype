import type { WorkflowPersonnalise } from '../../app/products/workspace/modules/tableau-de-bord/models/workflow.model';

/**
 * Workflows personnalisés du client (formulaires créés dans Workflow) et nombre de demandes par mois et par statut, sur les
 * mêmes 12 mois que `indicateurs-series.mock.ts` (MOIS). Servent à la statistique générique « Statistique de workflow personnalisé ».
 */
export const WORKFLOWS_PERSONNALISES: WorkflowPersonnalise[] = [
  {
    id: 'wf-mission',
    libelle: 'Demande de mission',
    demandesParMois: {
      validee: [12, 9, 14, 11, 16, 13, 15, 18, 10, 7, 14, 17],
      refusee: [2, 1, 3, 2, 1, 2, 4, 2, 1, 1, 2, 3],
      'en-attente': [0, 0, 0, 0, 0, 1, 0, 1, 1, 2, 3, 6],
    },
  },
  {
    id: 'wf-aide-sociale',
    libelle: "Demande d'aide sociale",
    demandesParMois: {
      validee: [3, 5, 2, 4, 3, 2, 3, 4, 6, 5, 3, 4],
      refusee: [1, 2, 1, 0, 1, 1, 2, 1, 1, 2, 1, 1],
      'en-attente': [0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 2, 3],
    },
  },
  {
    id: 'wf-materiel',
    libelle: 'Demande de matériel',
    demandesParMois: {
      validee: [8, 6, 11, 9, 7, 10, 8, 12, 9, 6, 10, 11],
      refusee: [3, 2, 4, 1, 2, 3, 2, 2, 3, 1, 2, 2],
      'en-attente': [0, 1, 0, 0, 1, 0, 1, 1, 2, 1, 3, 4],
    },
  },
];
