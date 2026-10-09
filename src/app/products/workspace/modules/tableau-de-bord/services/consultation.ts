import type { RoleDemo } from '../../../../../core/session/session.service';
import type { Employe } from '../../employes/models/employe.model';
import type { Population } from '../../configuration/populations/models/population.model';
import { employesCouverts } from '../../configuration/populations/services/population-regles';
import type { TableauDeBord } from '../models/tableau-de-bord.model';

/**
 * Tableaux de bord consultables. Seuls les tableaux actifs sont visibles. L'accès dépend uniquement de la population :
 * en démo, l'admin RH voit tous les tableaux actifs ; un manager, ceux dont la population le couvre.
 */
export function tableauxAccessibles(
  tableaux: TableauDeBord[],
  populations: Population[],
  role: RoleDemo,
  utilisateur: Employe | undefined,
  employes: Employe[],
): TableauDeBord[] {
  return tableaux.filter((t) => {
    if (t.statut !== 'Actif') return false;
    if (role === 'admin-rh') return true;
    const population = populations.find((p) => p.id === t.populationId);
    return !!utilisateur && !!population && employesCouverts(population, employes).some((e) => e.id === utilisateur.id);
  });
}

/** Employés du périmètre consulté : une filiale, ou toutes (vue consolidée). */
export function employesDuPerimetre(employes: Employe[], filiale: string | null): Employe[] {
  return filiale ? employes.filter((e) => e.filiale === filiale) : employes;
}
