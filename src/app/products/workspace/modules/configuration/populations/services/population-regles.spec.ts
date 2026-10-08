import { EMPLOYES } from '../../../../../../../mocks/data/employes.mock';
import type { ReglesPopulation } from '../models/population.model';
import { copierRegles, employesCouverts, valeursDuChamp } from './population-regles';

describe('population-regles', () => {
  const rhDakar = (combinaison: 'ET' | 'OU'): ReglesPopulation => ({
    combinaison,
    conditions: [
      { champ: 'departement', operateur: 'est', valeur: 'Ressources humaines' },
      { champ: 'site', operateur: 'est', valeur: 'Dakar' },
    ],
  });

  it('ET : garde les employés qui respectent toutes les conditions', () => {
    const couverts = employesCouverts(rhDakar('ET'), EMPLOYES);
    expect(couverts.length).toBe(3);
    expect(couverts.every((e) => e.departement === 'Ressources humaines' && e.site === 'Dakar')).toBeTrue();
  });

  it('OU : garde les employés qui respectent au moins une condition', () => {
    const couverts = employesCouverts(rhDakar('OU'), EMPLOYES);
    expect(couverts.length).toBe(11);
    expect(couverts.every((e) => e.departement === 'Ressources humaines' || e.site === 'Dakar')).toBeTrue();
  });

  it("« N'est pas » exclut la valeur", () => {
    const couverts = employesCouverts({ combinaison: 'ET', conditions: [{ champ: 'statut', operateur: 'nest_pas', valeur: 'Inactif' }] }, EMPLOYES);
    expect(couverts.length).toBe(EMPLOYES.length - 3);
  });

  it('sans condition, ne couvre personne', () => {
    expect(employesCouverts({ combinaison: 'OU', conditions: [] }, EMPLOYES)).toEqual([]);
  });

  it('liste les valeurs distinctes et triées d’un champ', () => {
    expect(valeursDuChamp('filiale', EMPLOYES)).toEqual(["Côte d'Ivoire", 'France', 'Sénégal']);
  });

  it('copie les règles sans lien avec la source', () => {
    const source = rhDakar('ET');
    const copie = copierRegles(source);
    copie.conditions[0].valeur = 'Finance';
    copie.conditions.push({ champ: 'statut', operateur: 'est', valeur: 'Actif' });
    expect(source.conditions.length).toBe(2);
    expect(source.conditions[0].valeur).toBe('Ressources humaines');
  });
});
