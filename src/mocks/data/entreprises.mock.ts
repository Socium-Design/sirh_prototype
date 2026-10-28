import type { Entreprise, ModuleEntreprise } from '../../app/products/workspace/modules/entreprises/models/entreprise.model';

/** Libellé complet des pastilles de modules (colonne « Modules » de la liste des entreprises). */
export const MODULES_ENTREPRISE: Record<ModuleEntreprise, string> = {
  CO: 'Core RH (Workspace)',
  JO: 'Job (Recrutement)',
  PA: 'Payroll',
  PE: 'Performance',
  WO: 'Workflow',
};

/** Entreprises clientes administrées par les CX (Workspace > Entreprises). */
export const ENTREPRISES: Entreprise[] = [
  { id: 'ent-1', nom: 'Teranga Logistique', paysConvention: 'Sénégal', modules: ['CO', 'JO', 'PE', 'WO'], formeJuridique: 'SA', creeLe: '2023-03-14', active: true },
  { id: 'ent-2', nom: 'Baobab Assurances', paysConvention: "Côte d'Ivoire", modules: ['CO', 'PA', 'PE'], formeJuridique: 'SARL', creeLe: '2022-11-02', active: true },
  { id: 'ent-3', nom: 'Sahel Énergie', paysConvention: 'Mali', modules: ['CO', 'WO'], formeJuridique: 'SAS', creeLe: '2024-06-20', active: true },
  { id: 'ent-4', nom: 'Atlantique Distribution', paysConvention: 'France', modules: ['CO', 'JO', 'PA', 'PE', 'WO'], formeJuridique: 'SAS', creeLe: '2021-09-07', active: true },
  { id: 'ent-5', nom: 'Kora Conseil', paysConvention: 'Sénégal', modules: ['CO', 'PE'], formeJuridique: 'SUARL', creeLe: '2025-01-28', active: false },
];
