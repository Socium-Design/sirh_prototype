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

  it('effectif total : compte les actifs du périmètre filtré, avec sa tendance', () => {
    const donnees = calculerDonnees(ind('ind-effectif-total'), EMPLOYES, [], SERIES_INDICATEURS);
    expect(donnees.valeur).toBe(20);
    expect(donnees.tendance).toEqual({ valeur: 13, periode: 'ce mois', hausseFavorable: true });
    expect(calculerDonnees(ind('ind-effectif-total'), EMPLOYES, ['site:Paris'], SERIES_INDICATEURS).valeur).toBe(4);
  });

  it('ancienneté moyenne : en années, à une décimale', () => {
    const { valeur, unite } = calculerDonnees(ind('ind-anciennete-moyenne'), EMPLOYES, [], SERIES_INDICATEURS);
    expect(unite).toBe('ans');
    expect(valeur).toBeGreaterThan(2);
    expect(valeur! * 10).toBe(Math.round(valeur! * 10));
  });

  it('répartition H/F : regroupe les employés filtrés par sexe', () => {
    const donnees = calculerDonnees(ind('ind-repartition-hf'), EMPLOYES, [], SERIES_INDICATEURS);
    expect(donnees.libelles).toEqual(['Femme', 'Homme']);
    expect(donnees.series[0].valeurs).toEqual([12, 11]);
  });

  it('série : renvoie une copie de la série fictive', () => {
    const donnees = calculerDonnees(ind('ind-delai-recrutement'), EMPLOYES, [], SERIES_INDICATEURS);
    expect(donnees).toEqual(jasmine.objectContaining({ valeur: 32, unite: 'jours' }));
    expect(donnees.tendance?.hausseFavorable).toBeFalse();
    donnees.valeur = 0;
    expect(SERIES_INDICATEURS.find((s) => s.id === 'delai-recrutement')!.donnees.valeur).toBe(32);
  });
});
