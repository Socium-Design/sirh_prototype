import { EMPLOYES } from '../../../../../../mocks/data/employes.mock';
import { INDICATEURS } from '../../../../../../mocks/data/indicateurs.mock';
import { SERIES_INDICATEURS } from '../../../../../../mocks/data/indicateurs-series.mock';
import { WORKFLOWS_PERSONNALISES } from '../../../../../../mocks/data/workflows-personnalises.mock';
import { calculerDonnees, filtrerEmployes, lireFiltre, type ContexteDonnees } from './indicateurs-donnees';

describe('indicateurs-donnees', () => {
  const ind = (id: string) => INDICATEURS.find((i) => i.id === id)!;
  const ctx: ContexteDonnees = { employes: EMPLOYES, facteur: 1, workflows: WORKFLOWS_PERSONNALISES };

  it('lit un filtre champ:valeur, même si la valeur contient « : »', () => {
    expect(lireFiltre('site:Dakar')).toEqual({ champ: 'site', valeur: 'Dakar' });
    expect(lireFiltre('structure:A : B')).toEqual({ champ: 'structure', valeur: 'A : B' });
  });

  it('filtres : OU entre valeurs d’un même champ, ET entre champs', () => {
    expect(filtrerEmployes(EMPLOYES, ['site:Dakar', 'site:Thiès']).length).toBe(12);
    expect(filtrerEmployes(EMPLOYES, ['site:Dakar', 'site:Thiès', 'departement:Ressources humaines']).length).toBe(6);
    expect(filtrerEmployes(EMPLOYES, []).length).toBe(EMPLOYES.length);
  });

  it('effectif total : compte le périmètre filtré (le statut est tranché par les filtres globaux), avec sa tendance', () => {
    const donnees = calculerDonnees(ind('ind-effectif-total'), ctx, [], SERIES_INDICATEURS);
    expect(donnees.valeur).toBe(23);
    expect(donnees.tendance).toEqual({ valeur: 13, periode: 'ce mois', hausseFavorable: true });
    expect(calculerDonnees(ind('ind-effectif-total'), ctx, ['site:Paris'], SERIES_INDICATEURS).valeur).toBe(5);
  });

  it('ancienneté moyenne : en années, à une décimale', () => {
    const { valeur, unite } = calculerDonnees(ind('ind-anciennete-moyenne'), ctx, [], SERIES_INDICATEURS);
    expect(unite).toBe('ans');
    expect(valeur).toBeGreaterThan(2);
    expect(valeur! * 10).toBe(Math.round(valeur! * 10));
  });

  it('répartition H/F : regroupe les employés filtrés par sexe', () => {
    const donnees = calculerDonnees(ind('ind-repartition-hf'), ctx, [], SERIES_INDICATEURS);
    expect(donnees.libelles).toEqual(['Femme', 'Homme']);
    expect(donnees.series[0].valeurs).toEqual([12, 11]);
  });

  it('série : copie de la série fictive, mise à l’échelle du périmètre', () => {
    const donnees = calculerDonnees(ind('ind-delai-recrutement'), ctx, [], SERIES_INDICATEURS);
    expect(donnees).toEqual(jasmine.objectContaining({ valeur: 32, unite: 'jours' }));
    expect(donnees.tendance?.hausseFavorable).toBeFalse();
    donnees.valeur = 0;
    expect(SERIES_INDICATEURS.find((s) => s.id === 'delai-recrutement')!.donnees.valeur).toBe(32);
    expect(calculerDonnees(ind('ind-delai-recrutement'), { ...ctx, facteur: 0.5 }, [], SERIES_INDICATEURS).valeur).toBe(16);
    expect(calculerDonnees(ind('ind-turnover-global'), { ...ctx, facteur: 0.5 }, [], SERIES_INDICATEURS).series[0].valeurs[0]).toBe(2.1);
  });

  it('workflow : demandes du workflow choisi par mois et par statut ; workflow inconnu = aucune série', () => {
    const stat = ind('ind-workflow-personnalise');
    const donnees = calculerDonnees(stat, ctx, [], SERIES_INDICATEURS, { workflowId: 'wf-aide-sociale', statuts: ['validee', 'en-attente'] });
    expect(donnees.series.map((s) => s.libelle)).toEqual(['Validée', 'En attente']);
    expect(donnees.series[0].valeurs).toEqual(WORKFLOWS_PERSONNALISES[1].demandesParMois.validee);
    expect(calculerDonnees(stat, ctx, [], SERIES_INDICATEURS, { workflowId: 'inconnu', statuts: [] }).series).toEqual([]);
  });
});
