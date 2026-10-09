import { EMPLOYES } from '../../../../../../mocks/data/employes.mock';
import { INDICATEURS } from '../../../../../../mocks/data/indicateurs.mock';
import { SERIES_INDICATEURS } from '../../../../../../mocks/data/indicateurs-series.mock';
import { TABLEAUX_DE_BORD } from '../../../../../../mocks/data/tableaux-de-bord.mock';
import { construireSections, libelleFiltre } from './widgets';

describe('widgets', () => {
  const rhGlobal = TABLEAUX_DE_BORD[0];

  it('rend un filtre lisible', () => {
    expect(libelleFiltre('site:Dakar')).toBe('Site : Dakar');
    expect(libelleFiltre("filiale:Côte d'Ivoire")).toBe("Filiale : Côte d'Ivoire");
  });

  it('regroupe les widgets par section et masque les sections vides (consultation)', () => {
    const sections = construireSections(rhGlobal, INDICATEURS, EMPLOYES, SERIES_INDICATEURS);
    expect(sections.map((s) => [s.libelle, s.widgets.length])).toEqual([['Effectifs', 4], ['Mouvements du personnel', 2]]);
  });

  it('garde les sections vides en composition', () => {
    expect(construireSections(rhGlobal, INDICATEURS, EMPLOYES, SERIES_INDICATEURS, true).length).toBe(6);
  });

  it('applique titre personnalisé, filtres et section renommée', () => {
    const [effectifs, mouvements] = construireSections(TABLEAUX_DE_BORD[2], INDICATEURS, EMPLOYES, SERIES_INDICATEURS);
    expect(effectifs.libelle).toBe('Effectifs par pays');
    const turnover = construireSections(rhGlobal, INDICATEURS, EMPLOYES, SERIES_INDICATEURS)[1].widgets[1];
    expect(turnover.titre).toBe('Turnover mensuel');
    expect(turnover.description).toBe('Départs rapportés à l’effectif moyen, mois par mois.');
    expect(turnover.personnalise).toBeTrue();
    expect(turnover.filtres.map((f) => f.libelle)).toEqual(['Site : Dakar', 'Site : Thiès']);
    expect(mouvements.widgets[0].personnalise).toBeFalse();
  });

  it('calcule les données de chaque widget avec ses filtres', () => {
    const parSite = construireSections(TABLEAUX_DE_BORD[2], INDICATEURS, EMPLOYES, SERIES_INDICATEURS)[0].widgets[1];
    expect(parSite.donnees.libelles).toEqual(['Abidjan', 'Paris']);
  });
});
