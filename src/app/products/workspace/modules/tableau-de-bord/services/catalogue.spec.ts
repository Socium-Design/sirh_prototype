import { INDICATEURS_NON_SOUSCRITS } from '../../../../../../mocks/data/abonnements.mock';
import { INDICATEURS, SECTIONS_CATALOGUE } from '../../../../../../mocks/data/indicateurs.mock';
import type { Indicateur } from '../models/indicateur.model';
import { construireCatalogue } from './catalogue';

describe('construireCatalogue', () => {
  const indicateur = (id: string, sectionId: string): Indicateur => ({ ...INDICATEURS[0], id, sectionId });

  it('les cinq sections du catalogue, avec leurs indicateurs', () => {
    const catalogue = construireCatalogue(SECTIONS_CATALOGUE, INDICATEURS, INDICATEURS_NON_SOUSCRITS);
    expect(catalogue.map((s) => [s.libelle, s.indicateurs.map((i) => i.titre)])).toEqual([
      ['Gestion du capital humain', ['Effectif total', 'Pyramide des âges', 'Ancienneté moyenne', 'Répartition H/F']],
      ['Recrutement et mobilité', ['Entonnoir recrutement', 'Délai moyen recrutement', 'Coût moyen par embauche']],
      ['Mouvement du personnel', ['Turnover global', 'Turnover par département']],
      ['Masse salariale', ['Masse salariale mensuelle', 'Charges patronales']],
      ['Absences et congés', ['Absences par motif', "Taux d'absentéisme"]],
    ]);
  });

  it('marque (sans masquer) les indicateurs non souscrits', () => {
    const indicateurs = construireCatalogue(SECTIONS_CATALOGUE, INDICATEURS, INDICATEURS_NON_SOUSCRITS).flatMap((s) => s.indicateurs);
    expect(indicateurs.length).toBe(INDICATEURS.length);
    expect(indicateurs.filter((i) => !i.disponible).map((i) => i.titre)).toEqual(['Coût moyen par embauche', 'Charges patronales']);
  });

  it('masque une section sans indicateur, garde l’ordre des sections', () => {
    const catalogue = construireCatalogue(SECTIONS_CATALOGUE, [indicateur('b', 'absences'), indicateur('a', 'capital-humain')], []);
    expect(catalogue.map((s) => [s.id, s.indicateurs.map((i) => i.id)])).toEqual([['capital-humain', ['a']], ['absences', ['b']]]);
  });
});
