import { INDICATEURS } from '../../../../../../mocks/data/indicateurs.mock';
import { TABLEAUX_DE_BORD } from '../../../../../../mocks/data/tableaux-de-bord.mock';
import { ajouterWidget, modifierWidget, renommerSection, retirerWidget } from './composition';


describe('composition', () => {
  const managers = TABLEAUX_DE_BORD[2];
  const ind = (id: string) => INDICATEURS.find((i) => i.id === id)!;

  it('ajoute un indicateur une seule fois, dans sa section, sans modifier l’original', () => {
    const avec = ajouterWidget(managers, ind('ind-masse-salariale'));
    expect(avec.widgets.length).toBe(5);
    expect(avec.widgets.at(-1)).toEqual(jasmine.objectContaining({ indicateurId: 'ind-masse-salariale', sectionId: 'masse-salariale', filtres: [] }));
    expect(ajouterWidget(avec, ind('ind-masse-salariale'))).toBe(avec);
    expect(managers.widgets.length).toBe(4);
  });

  it('statistique de workflow : demande un nom et un workflow, s’ajoute autant de fois que voulu', () => {
    const stat = ind('ind-workflow-personnalise');
    expect(ajouterWidget(managers, stat)).toBe(managers);
    expect(ajouterWidget(managers, stat, { titre: ' ', workflowId: 'wf-mission' })).toBe(managers);
    const une = ajouterWidget(managers, stat, { titre: ' Demandes de mission ', workflowId: 'wf-mission' });
    const deux = ajouterWidget(une, stat, { titre: 'Aide sociale', workflowId: 'wf-aide-sociale' });
    expect(deux.widgets.slice(-2)).toEqual([
      jasmine.objectContaining({ indicateurId: stat.id, titre: 'Demandes de mission', sectionId: 'workflows-personnalises', workflow: { workflowId: 'wf-mission', statuts: [] } }),
      jasmine.objectContaining({ titre: 'Aide sociale', workflow: { workflowId: 'wf-aide-sociale', statuts: [] } }),
    ]);
  });

  it('retire un graphe', () => {
    expect(retirerWidget(managers, managers.widgets[0].id).widgets.length).toBe(3);
  });

  it('modifie titre, description, section et critères de filtre ; un texte identique au catalogue n’est pas stocké', () => {
    const w = managers.widgets[0];
    const modifie = modifierWidget(managers, w.id, ind(w.indicateurId), {
      titre: 'Effectif de l’équipe',
      description: ind(w.indicateurId).description,
      sectionId: 'absences',
      filtres: ['site', 'sexe'],
    }).widgets[0];
    // « Sexe » n'est pas un critère de l'effectif total : il n'est pas gardé.
    expect(modifie).toEqual({ id: w.id, indicateurId: w.indicateurId, titre: 'Effectif de l’équipe', sectionId: 'absences', filtres: ['site'] });
  });

  it('filtre « Population » (KPI filtrables seulement) et statuts d’une statistique de workflow', () => {
    const effectif = managers.widgets[0];
    const base = { titre: 'Effectif total', description: '', sectionId: effectif.sectionId, filtres: [] };
    expect(modifierWidget(managers, effectif.id, ind('ind-effectif-total'), { ...base, populationId: 'pop-2' }).widgets[0].populationId).toBe('pop-2');
    expect(modifierWidget(managers, effectif.id, ind('ind-effectif-total'), { ...base, populationId: '' }).widgets[0].populationId).toBeUndefined();
    const turnover = managers.widgets.find((w) => w.indicateurId === 'ind-turnover-departement')!;
    const nonFiltrable = modifierWidget(managers, turnover.id, ind(turnover.indicateurId), { ...base, sectionId: 'mouvements', populationId: 'pop-2' });
    expect(nonFiltrable.widgets.find((w) => w.id === turnover.id)!.populationId).toBeUndefined();

    const stat = ind('ind-workflow-personnalise');
    const avec = ajouterWidget(managers, stat, { titre: 'Missions', workflowId: 'wf-mission' });
    const w = avec.widgets.at(-1)!;
    const filtre = modifierWidget(avec, w.id, stat, { titre: 'Missions', description: '', sectionId: w.sectionId, filtres: [], statuts: ['refusee', 'en-attente'] });
    expect(filtre.widgets.at(-1)!.workflow).toEqual({ workflowId: 'wf-mission', statuts: ['refusee', 'en-attente'] });
  });

  it('renomme une section pour ce tableau ; un nom vide est ignoré', () => {
    expect(renommerSection(managers, 'mouvements', '  Départs  ').sections.find((s) => s.id === 'mouvements')?.libelle).toBe('Départs');
    expect(renommerSection(managers, 'mouvements', ' ')).toBe(managers);
  });
});
