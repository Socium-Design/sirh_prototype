import { EMPLOYES } from '../../../../../../../mocks/data/employes.mock';
import type { ReglesPopulation } from '../models/population.model';
import { copierRegles, employesCouverts, populationsSimilaires, reglesIdentiques, valeursDuChamp } from './population-regles';

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

  describe('similarité', () => {
    const populations = [
      { id: 'a', ...rhDakar('ET') },
      { id: 'b', combinaison: 'ET' as const, conditions: [{ champ: 'statut' as const, operateur: 'est' as const, valeur: 'Inactif' }] },
    ];

    it('critères identiques, quel que soit l’ordre des conditions', () => {
      const inverse: ReglesPopulation = { combinaison: 'ET', conditions: [...rhDakar('ET').conditions].reverse() };
      expect(reglesIdentiques(inverse, rhDakar('ET'))).toBeTrue();
      expect(reglesIdentiques(rhDakar('OU'), rhDakar('ET'))).toBeFalse();
      expect(populationsSimilaires(inverse, populations, EMPLOYES).map((s) => [s.population.id, s.raison])).toEqual([['a', 'criteres-identiques']]);
    });

    it('mêmes employés couverts avec des critères différents', () => {
      const memes: ReglesPopulation = { combinaison: 'ET', conditions: [{ champ: 'statut', operateur: 'nest_pas', valeur: 'Actif' }] };
      expect(populationsSimilaires(memes, populations, EMPLOYES).map((s) => [s.population.id, s.raison])).toEqual([['b', 'memes-employes']]);
    });

    it('ignore la population modifiée elle-même et les règles vides', () => {
      expect(populationsSimilaires(rhDakar('ET'), populations, EMPLOYES, 'a')).toEqual([]);
      expect(populationsSimilaires({ combinaison: 'ET', conditions: [] }, populations, EMPLOYES)).toEqual([]);
    });

    it('ne signale pas deux populations qui ne couvrent personne', () => {
      const vide: ReglesPopulation = { combinaison: 'ET', conditions: [{ champ: 'site', operateur: 'est', valeur: 'Lyon' }] };
      const autreVide = { id: 'c', combinaison: 'ET' as const, conditions: [{ champ: 'site' as const, operateur: 'est' as const, valeur: 'Lille' }] };
      expect(populationsSimilaires(vide, [autreVide], EMPLOYES)).toEqual([]);
    });
  });
});
