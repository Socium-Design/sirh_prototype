import { EMPLOYES } from '../../../../../../../mocks/data/employes.mock';
import type { ReglesPopulation } from '../models/population.model';
import { copierRegles, employesCouverts, populationDeMemeNom, respecteCondition, valeursDuChamp } from './population-regles';

describe('population-regles', () => {
  const awa = EMPLOYES[0]; // Dakar, Sénégal, CDI, Femme

  it('« est » : la valeur de l’employé fait partie des valeurs choisies ; « n’est pas » : l’inverse', () => {
    expect(respecteCondition(awa, { champ: 'site', operateur: 'est', valeurs: ['Thiès', 'Dakar'] })).toBeTrue();
    expect(respecteCondition(awa, { champ: 'site', operateur: 'est', valeurs: ['Thiès'] })).toBeFalse();
    expect(respecteCondition(awa, { champ: 'site', operateur: 'nest_pas', valeurs: ['Thiès', 'Paris'] })).toBeTrue();
    expect(respecteCondition(awa, { champ: 'sexe', operateur: 'est', valeurs: ['Femme'] })).toBeTrue();
  });

  it('combine les conditions en ET ou en OU ; sans condition, personne', () => {
    const et: ReglesPopulation = {
      combinaison: 'ET',
      conditions: [
        { champ: 'filiale', operateur: 'est', valeurs: ['Sénégal'] },
        { champ: 'typeContrat', operateur: 'est', valeurs: ['CDI'] },
      ],
    };
    const ou: ReglesPopulation = { ...et, combinaison: 'OU' };
    const senegal = EMPLOYES.filter((e) => e.filiale === 'Sénégal');
    const cdi = EMPLOYES.filter((e) => e.typeContrat === 'CDI');
    expect(employesCouverts(et, EMPLOYES).length).toBe(senegal.filter((e) => e.typeContrat === 'CDI').length);
    expect(employesCouverts(ou, EMPLOYES).length).toBe(new Set([...senegal, ...cdi]).size);
    expect(employesCouverts({ combinaison: 'ET', conditions: [] }, EMPLOYES)).toEqual([]);
  });

  it('propose les valeurs existantes de chaque champ, y compris contrat, sexe et ancienneté', () => {
    expect(valeursDuChamp('sexe', EMPLOYES)).toEqual(['Femme', 'Homme']);
    expect(valeursDuChamp('typeContrat', EMPLOYES)).toEqual(['CDD', 'CDI', 'Prestataire', 'Stage']);
    expect(valeursDuChamp('anciennete', EMPLOYES).length).toBeGreaterThan(1);
  });

  it('copie des règles indépendante de la source', () => {
    const source: ReglesPopulation = { combinaison: 'OU', conditions: [{ champ: 'site', operateur: 'est', valeurs: ['Dakar'] }] };
    const copie = copierRegles(source);
    copie.conditions[0].valeurs.push('Thiès');
    expect(source.conditions[0].valeurs).toEqual(['Dakar']);
  });

  it('repère une population de même nom (casse et espaces ignorés), hors population modifiée', () => {
    const populations = [{ id: 'a', nom: 'Équipe Sénégal' }, { id: 'b', nom: 'RH' }];
    expect(populationDeMemeNom('  équipe sénégal ', populations)?.id).toBe('a');
    expect(populationDeMemeNom('Équipe Sénégal', populations, 'a')).toBeUndefined();
    expect(populationDeMemeNom('Autre', populations)).toBeUndefined();
    expect(populationDeMemeNom('  ', populations)).toBeUndefined();
  });
});
