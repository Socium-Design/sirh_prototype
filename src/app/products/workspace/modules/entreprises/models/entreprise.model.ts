/** Pastilles de modules souscrits : CO (Core RH / Workspace), JO (Job), PA (Payroll), PE (Performance), WO (Workflow). */
export type ModuleEntreprise = 'CO' | 'JO' | 'PA' | 'PE' | 'WO';

export interface Entreprise {
  id: string;
  nom: string;
  paysConvention: string;
  modules: ModuleEntreprise[];
  formeJuridique: string;
  /** Date ISO (AAAA-MM-JJ). */
  creeLe: string;
  active: boolean;
}
