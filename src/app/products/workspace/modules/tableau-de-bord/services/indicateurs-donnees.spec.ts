import { EMPLOYES } from '../../../../../../mocks/data/employes.mock';
import { INDICATEURS } from '../../../../../../mocks/data/indicateurs.mock';
import { SERIES_INDICATEURS } from '../../../../../../mocks/data/indicateurs-series.mock';
import { calculerDonnees, filtrerEmployes, lireFiltre } from './indicateurs-donnees';

describe('indicateurs-donnees', () => {
  const ind = (id: string) => INDICATEURS.find((i) => i.id === id)!;

  it('lit un filtre champ:valeur, même si la valeur contient « : »', () => {
    expect(lireFiltre('site:Dakar')).toEqual({ champ: 'site', valeur: 'Dakar' });
    expect(lireFiltre('structure:A : B')).toEqual({ champ: 'structure', valeur: 'A : B' });
  });

  it('filtres : OU entre valeurs d’un même champ, ET entre champs', () => {
    expect(filtrerEmployes(EMPLOYES, ['site:Dakar', 'site:Thiès']).length).toBe(12);
    expect(filtrerEmployes(EMPLOYES, ['site:Dakar', 'site:Thiès', 'departement:Ressources humaines']).length).toBe(6);
    expect(filtrerEmployes(EMPLOYES, []).length).toBe(EMPLOYES.length);
  });

  it('KPI effectif : compte les actifs du périmètre filtré', () => {
    expect(calculerDonnees(ind('ind-effectif-total'), EMPLOYES, [], SERIES_INDICATEURS).valeur).toBe(20);
    expect(calculerDonnees(ind('ind-effectif-total'), EMPLOYES, ['site:Paris'], SERIES_INDICATEURS).valeur).toBe(4);
  });

  it('répartition : regroupe les employés filtrés par valeur du champ', () => {
    const donnees = calculerDonnees(ind('ind-repartition-site'), EMPLOYES, [], SERIES_INDICATEURS);
    expect(donnees.libelles).toEqual(['Abidjan', 'Dakar', 'Paris', 'Thiès']);
    expect(donnees.series[0].valeurs).toEqual([6, 6, 5, 6]);
    expect(calculerDonnees(ind('ind-repartition-filiale'), EMPLOYES, ['filiale:France'], SERIES_INDICATEURS).libelles).toEqual(['France']);
  });

  it('série : renvoie une copie de la série fictive', () => {
    const donnees = calculerDonnees(ind('ind-entretiens'), EMPLOYES, [], SERIES_INDICATEURS);
    expect(donnees).toEqual(jasmine.objectContaining({ valeur: 16, max: 23 }));
    donnees.valeur = 0;
    expect(SERIES_INDICATEURS.find((s) => s.id === 'entretiens')!.donnees.valeur).toBe(16);
  });
});
