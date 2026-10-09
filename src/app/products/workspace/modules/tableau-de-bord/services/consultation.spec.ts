import { EMPLOYES } from '../../../../../../mocks/data/employes.mock';
import { INDICATEURS } from '../../../../../../mocks/data/indicateurs.mock';
import { SERIES_INDICATEURS } from '../../../../../../mocks/data/indicateurs-series.mock';
import { TABLEAUX_DE_BORD } from '../../../../../../mocks/data/tableaux-de-bord.mock';
import { sectionsConsultation, tableauDuRole } from './consultation';
import { construireWidgets } from './widgets';

describe('consultation', () => {
  it('chaque rôle consulte le premier tableau actif ouvert à son profil', () => {
    expect(tableauDuRole(TABLEAUX_DE_BORD, 'admin-rh')?.id).toBe('tdb-1');
    expect(tableauDuRole(TABLEAUX_DE_BORD, 'manager')?.id).toBe('tdb-3');
    expect(tableauDuRole(TABLEAUX_DE_BORD, 'direction-generale')?.id).toBe('tdb-2');
    expect(tableauDuRole(TABLEAUX_DE_BORD.map((t) => ({ ...t, statut: 'Inactif' as const })), 'manager')).toBeUndefined();
  });

  it('sections : KPI en « Indicateurs clés », puis les graphes par thème, sans section vide', () => {
    const vues = construireWidgets(TABLEAUX_DE_BORD[0], INDICATEURS, EMPLOYES, SERIES_INDICATEURS);
    const sections = sectionsConsultation(vues);
    expect(sections.map((s) => [s.libelle, s.widgets.map((w) => w.indicateur.titre)])).toEqual([
      ['Indicateurs clés', ['Effectif total', 'Ancienneté moyenne']],
      ['Effectifs et mouvements', ['Pyramide des âges', 'Répartition H/F', 'Turnover global', 'Turnover par département']],
      ['Rémunération et absentéisme', ['Masse salariale mensuelle', 'Absences par motif', "Taux d'absentéisme"]],
    ]);
    expect(sectionsConsultation(vues.filter((v) => v.indicateur.typeGraphique === 'kpi')).map((s) => s.libelle)).toEqual(['Indicateurs clés']);
    expect(sectionsConsultation([])).toEqual([]);
  });
});
