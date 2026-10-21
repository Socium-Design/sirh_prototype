import { EMPLOYES } from '../../../../../../mocks/data/employes.mock';
import { INDICATEURS } from '../../../../../../mocks/data/indicateurs.mock';
import { SERIES_INDICATEURS } from '../../../../../../mocks/data/indicateurs-series.mock';
import { POPULATIONS } from '../../../../../../mocks/data/populations.mock';
import { TABLEAUX_DE_BORD } from '../../../../../../mocks/data/tableaux-de-bord.mock';
import { WORKFLOWS_PERSONNALISES } from '../../../../../../mocks/data/workflows-personnalises.mock';
import { sectionsConsultation } from './consultation';
import { construireWidgets } from './widgets';

describe('consultation', () => {
  const ctx = { employes: EMPLOYES, populations: POPULATIONS, workflows: WORKFLOWS_PERSONNALISES, series: SERIES_INDICATEURS };

  it('sections : KPI en « Indicateurs clés », puis les graphes par thème (workflows personnalisés compris), sans section vide', () => {
    const vues = construireWidgets(TABLEAUX_DE_BORD[0], INDICATEURS, ctx);
    const sections = sectionsConsultation(vues);
    expect(sections.map((s) => [s.libelle, s.widgets.map((w) => w.titre)])).toEqual([
      ['Indicateurs clés', ['Effectif total', 'Ancienneté moyenne']],
      ['Effectifs et mouvements', ['Pyramide des âges', 'Répartition H/F', 'Turnover mensuel', 'Turnover par département']],
      ['Rémunération et absentéisme', ['Masse salariale mensuelle', 'Absences par motif', "Taux d'absentéisme"]],
      ['Workflows personnalisés', ['Demandes de mission']],
    ]);
    expect(sectionsConsultation(vues.filter((v) => v.indicateur.typeGraphique === 'kpi')).map((s) => s.libelle)).toEqual(['Indicateurs clés']);
    expect(sectionsConsultation([])).toEqual([]);
  });
});
