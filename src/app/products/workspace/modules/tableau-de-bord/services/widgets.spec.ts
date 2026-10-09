import { EMPLOYES } from '../../../../../../mocks/data/employes.mock';
import { INDICATEURS } from '../../../../../../mocks/data/indicateurs.mock';
import { SERIES_INDICATEURS } from '../../../../../../mocks/data/indicateurs-series.mock';
import { POPULATIONS } from '../../../../../../mocks/data/populations.mock';
import { TABLEAUX_DE_BORD } from '../../../../../../mocks/data/tableaux-de-bord.mock';
import { construireSections, construireWidgets, employesDuTableau, libelleFiltre } from './widgets';

describe('widgets', () => {
  const [rhGlobal, , managers] = TABLEAUX_DE_BORD;

  it('rend un filtre lisible', () => {
    expect(libelleFiltre('site:Dakar')).toBe('Site : Dakar');
    expect(libelleFiltre("filiale:Côte d'Ivoire")).toBe("Filiale : Côte d'Ivoire");
  });

  it('périmètre : les employés de la population du tableau (version figée si besoin), personne sans population', () => {
    expect(employesDuTableau(managers, POPULATIONS, EMPLOYES).length).toBe(7);
    const fige = { ...managers, reglesFigees: { combinaison: 'ET' as const, conditions: [{ champ: 'site' as const, operateur: 'est' as const, valeurs: ['Paris'] }] } };
    expect(employesDuTableau(fige, POPULATIONS, EMPLOYES).length).toBe(5);
    expect(employesDuTableau({ ...managers, populationId: null }, POPULATIONS, EMPLOYES)).toEqual([]);
  });

  it('regroupe les widgets par section (sections renommées comprises), sans section vide', () => {
    const sections = construireSections(managers, INDICATEURS, EMPLOYES, SERIES_INDICATEURS);
    expect(sections.map((s) => [s.libelle, s.widgets.length])).toEqual([
      ['Gestion du capital humain', 1],
      ['Mouvement du personnel', 1],
      ['Absences de mon équipe', 2],
    ]);
  });

  it('applique titre personnalisé et filtres', () => {
    const turnover = construireWidgets(rhGlobal, INDICATEURS, EMPLOYES, SERIES_INDICATEURS).find((v) => v.indicateur.id === 'ind-turnover-global')!;
    expect(turnover.titre).toBe('Turnover mensuel');
    expect(turnover.description).toBe('Départs rapportés à l’effectif moyen, mois par mois.');
    expect(turnover.filtres.map((f) => f.libelle)).toEqual(['Site : Dakar', 'Site : Thiès']);
  });
});
