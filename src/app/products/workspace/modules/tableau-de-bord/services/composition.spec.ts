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

  it('retire un graphe', () => {
    expect(retirerWidget(managers, managers.widgets[0].id).widgets.length).toBe(3);
  });

  it('modifie titre, description, section et filtres ; un texte identique au catalogue n’est pas stocké', () => {
    const w = managers.widgets[0];
    const modifie = modifierWidget(managers, w.id, ind(w.indicateurId), {
      titre: 'Effectif de l’équipe',
      description: ind(w.indicateurId).description,
      sectionId: 'absences',
      filtres: ['site:Dakar'],
    }).widgets[0];
    expect(modifie).toEqual({ id: w.id, indicateurId: w.indicateurId, titre: 'Effectif de l’équipe', sectionId: 'absences', filtres: ['site:Dakar'] });
  });

  it('renomme une section pour ce tableau ; un nom vide est ignoré', () => {
    expect(renommerSection(managers, 'mouvements', '  Départs  ').sections.find((s) => s.id === 'mouvements')?.libelle).toBe('Départs');
    expect(renommerSection(managers, 'mouvements', ' ')).toBe(managers);
  });
});
