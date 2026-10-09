import type { PopulationUsage } from '../../app/products/workspace/modules/configuration/populations/models/population.model';

/** Dashboards et modules qui s'appuient sur une population (cf. `populations.mock.ts`). */
export const POPULATION_USAGES: PopulationUsage[] = [
  { id: 'usage-1', libelle: 'Dashboard RH Global', type: 'Dashboard', produit: 'Workspace', populationId: 'pop-1' },
  { id: 'usage-2', libelle: 'Workflow congés', type: 'Module', produit: 'Workflow', populationId: 'pop-1' },
  { id: 'usage-3', libelle: 'Perf campagne 2026', type: 'Module', produit: 'Perf', populationId: 'pop-1' },
  { id: 'usage-4', libelle: 'Dashboard masse salariale', type: 'Dashboard', produit: 'Payroll', populationId: 'pop-2' },
  { id: 'usage-5', libelle: 'Objectifs DSI 2026', type: 'Module', produit: 'Perf', populationId: 'pop-3' },
  { id: 'usage-6', libelle: 'Workflow notes de frais', type: 'Module', produit: 'Workflow', populationId: 'pop-5' },
  { id: 'usage-7', libelle: 'Dashboard effectifs internationaux', type: 'Dashboard', produit: 'Workspace', populationId: 'pop-5' },
];
