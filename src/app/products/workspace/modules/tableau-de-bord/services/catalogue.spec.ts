import { INDICATEURS, SECTIONS_CATALOGUE } from '../../../../../../mocks/data/indicateurs.mock';
import type { Indicateur } from '../models/indicateur.model';
import { construireCatalogue } from './catalogue';

describe('construireCatalogue', () => {
  const indicateur = (id: string, sectionId: string, produit: Indicateur['produit']): Indicateur => ({ ...INDICATEURS[0], id, sectionId, produit });

  it('masque les sections sans indicateur', () => {
    const catalogue = construireCatalogue(SECTIONS_CATALOGUE, INDICATEURS, ['workspace', 'perf', 'workflow', 'payroll', 'doc']);
    expect(catalogue.map((s) => s.id)).toEqual(['effectifs', 'mouvements', 'performance', 'temps', 'paie']);
    expect(catalogue.some((s) => s.id === 'formation')).toBeFalse();
  });

  it('garde l’ordre des sections et range chaque indicateur dans la sienne', () => {
    const catalogue = construireCatalogue(SECTIONS_CATALOGUE, [indicateur('b', 'mouvements', 'workspace'), indicateur('a', 'effectifs', 'workspace')], ['workspace']);
    expect(catalogue.map((s) => [s.id, s.indicateurs.map((i) => i.id)])).toEqual([['effectifs', ['a']], ['mouvements', ['b']]]);
  });

  it('grise (sans masquer) les indicateurs des produits non souscrits', () => {
    const catalogue = construireCatalogue(SECTIONS_CATALOGUE, INDICATEURS, ['workspace', 'perf', 'workflow']);
    const indicateurs = catalogue.flatMap((s) => s.indicateurs);
    expect(indicateurs.length).toBe(INDICATEURS.length);
    expect(indicateurs.filter((i) => !i.disponible).map((i) => i.id)).toEqual(['ind-masse-salariale']);
  });

  it('garde une section dont tous les indicateurs sont grisés', () => {
    const catalogue = construireCatalogue(SECTIONS_CATALOGUE, INDICATEURS, ['workspace']);
    expect(catalogue.find((s) => s.id === 'paie')?.indicateurs.every((i) => !i.disponible)).toBeTrue();
  });
});
