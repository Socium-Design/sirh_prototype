import { EMPLOYES } from '../../../../../../mocks/data/employes.mock';
import { INDICATEURS } from '../../../../../../mocks/data/indicateurs.mock';
import { SERIES_INDICATEURS } from '../../../../../../mocks/data/indicateurs-series.mock';
import { POPULATIONS } from '../../../../../../mocks/data/populations.mock';
import { TABLEAUX_DE_BORD } from '../../../../../../mocks/data/tableaux-de-bord.mock';
import { WORKFLOWS_PERSONNALISES } from '../../../../../../mocks/data/workflows-personnalises.mock';
import { employesCouverts } from '../../configuration/populations/services/population-regles';
import { appliquerFiltresGlobaux, filtresGlobauxParDefaut } from './filtres-globaux';
import { construireSections, construireWidget, construireWidgets, libelleFiltre, type ContexteWidgets } from './widgets';

describe('widgets', () => {
  const [rhGlobal, , managers] = TABLEAUX_DE_BORD;
  const ctx: ContexteWidgets = { employes: EMPLOYES, populations: POPULATIONS, workflows: WORKFLOWS_PERSONNALISES, series: SERIES_INDICATEURS };
  const ind = (id: string) => INDICATEURS.find((i) => i.id === id)!;
  const vue = (tableau = rhGlobal, indicateurId: string, c = ctx) => construireWidgets(tableau, INDICATEURS, c).find((v) => v.indicateur.id === indicateurId)!;

  it('rend un filtre lisible', () => {
    expect(libelleFiltre('site:Dakar')).toBe('Site : Dakar');
    expect(libelleFiltre("filiale:Côte d'Ivoire")).toBe("Filiale : Côte d'Ivoire");
  });

  it('données du périmètre de l’utilisateur, pas de la population adressée ; filtres globaux par défaut (sortis et comptes désactivés exclus)', () => {
    expect(vue(managers, 'ind-effectif-total').donnees.valeur).toBe(18);
    expect(vue(rhGlobal, 'ind-effectif-total').donnees.valeur).toBe(18);
    const tous = { ...ctx, filtresGlobaux: { ...filtresGlobauxParDefaut(), statutEmploye: ['Actif', 'Sorti'] as ('Actif' | 'Sorti')[], statutCompte: ['Actif', 'Désactivé'] as ('Actif' | 'Désactivé')[] } };
    expect(vue(managers, 'ind-effectif-total', tous).donnees.valeur).toBe(23);
  });

  it('regroupe les widgets par section (sections renommées comprises), sans section vide', () => {
    const sections = construireSections(managers, INDICATEURS, ctx);
    expect(sections.map((s) => [s.libelle, s.widgets.length])).toEqual([
      ['Gestion du capital humain', 1],
      ['Mouvement du personnel', 1],
      ['Absences de mon équipe', 2],
    ]);
  });

  it('applique titre personnalisé et filtres', () => {
    const turnover = vue(rhGlobal, 'ind-turnover-global');
    expect(turnover.titre).toBe('Turnover mensuel');
    expect(turnover.description).toBe('Départs rapportés à l’effectif moyen, mois par mois.');
    expect(turnover.filtres.map((f) => f.libelle)).toEqual(['Site : Dakar', 'Site : Thiès']);
    expect(turnover.filtresIgnores).toEqual([]);
  });

  it('filtre de carte contraire aux filtres globaux : le global l’emporte et la carte le signale', () => {
    const hf = vue(rhGlobal, 'ind-repartition-hf');
    expect(hf.filtresIgnores).toEqual(['Statut : Inactif']);
    expect(hf.donnees.series[0].valeurs.reduce((a, b) => a + b, 0)).toBe(18);
    const avecSortis = { ...ctx, filtresGlobaux: { ...filtresGlobauxParDefaut(), statutEmploye: ['Actif', 'Sorti'] as ('Actif' | 'Sorti')[] } };
    expect(vue(rhGlobal, 'ind-repartition-hf', avecSortis).filtresIgnores).toEqual([]);
  });

  it('filtre « Population » d’une carte : effectif de cette population dans le périmètre, affiché dans les filtres', () => {
    const widget = { ...managers.widgets[0], populationId: 'pop-2' };
    const effectif = construireWidget(widget, ind('ind-effectif-total'), ctx);
    const attendu = employesCouverts(POPULATIONS[1], appliquerFiltresGlobaux(EMPLOYES, filtresGlobauxParDefaut())).length;
    expect(effectif.donnees.valeur).toBe(attendu);
    expect(attendu).toBeLessThan(18);
    expect(effectif.filtres.map((f) => f.libelle)).toEqual(['Population : Fonctions support']);
    // Un indicateur non filtrable par population ignore ce filtre.
    const turnover = construireWidget({ ...widget, indicateurId: 'ind-turnover-departement' }, ind('ind-turnover-departement'), ctx);
    expect(turnover.filtres).toEqual([]);
  });

  it('statistique de workflow : histogramme empilé par mois, une série colorée par statut, filtre par statut', () => {
    const stat = vue(rhGlobal, 'ind-workflow-personnalise');
    expect(stat.titre).toBe('Demandes de mission');
    expect(stat.description).toBe('Demandes « Demande de mission », par mois et par statut.');
    expect(stat.donnees.libelles.length).toBe(12);
    expect(stat.donnees.series.map((s) => [s.libelle, s.couleur])).toEqual([['Validée', 'green'], ['Refusée', 'red'], ['En attente', 'amber']]);
    const widget = { ...stat.widget, workflow: { workflowId: 'wf-materiel', statuts: ['refusee' as const] } };
    const refusees = construireWidget(widget, stat.indicateur, ctx);
    expect(refusees.donnees.series.map((s) => s.libelle)).toEqual(['Refusée']);
    expect(refusees.donnees.series[0].valeurs).toEqual(WORKFLOWS_PERSONNALISES[2].demandesParMois.refusee);
    expect(refusees.filtres.map((f) => f.libelle)).toEqual(['Statut : Refusée']);
  });

  it('les séries fictives suivent les filtres globaux (mise à l’échelle du périmètre)', () => {
    const reduit = { ...ctx, filtresGlobaux: { ...filtresGlobauxParDefaut(), compteConfigure: ['Oui'] as ('Oui' | 'Non')[] } };
    const avant = vue(rhGlobal, 'ind-masse-salariale').donnees.series[0].valeurs;
    const apres = vue(rhGlobal, 'ind-masse-salariale', reduit).donnees.series[0].valeurs;
    expect(avant).toEqual(SERIES_INDICATEURS.find((s) => s.id === 'masse-salariale')!.donnees.series[0].valeurs);
    expect(apres.every((v, i) => v < avant[i])).toBeTrue();
  });
});
