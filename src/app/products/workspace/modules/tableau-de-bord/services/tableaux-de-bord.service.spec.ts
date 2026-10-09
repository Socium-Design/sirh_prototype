import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TABLEAUX_DE_BORD } from '../../../../../../mocks/data/tableaux-de-bord.mock';
import { TableauxDeBordService, peutEtreActive } from './tableaux-de-bord.service';

describe('TableauxDeBordService', () => {
  let service: TableauxDeBordService;
  beforeEach(() => (service = TestBed.inject(TableauxDeBordService)));

  it("n'autorise l'activation qu'après une prévisualisation", () => {
    const [actif, archive, , jamaisPrevisualise] = TABLEAUX_DE_BORD;
    expect(peutEtreActive(actif)).toBeFalse(); // déjà actif
    expect(peutEtreActive(archive)).toBeTrue();
    expect(peutEtreActive(jamaisPrevisualise)).toBeFalse();
  });

  it("refuse d'activer un tableau jamais prévisualisé", fakeAsync(() => {
    let erreur = '';
    service.changerStatut('tdb-4', 'Actif').subscribe({ error: (e: Error) => (erreur = e.message) });
    tick(300);
    expect(erreur).toContain('Prévisualisez');
  }));

  it('change le statut en mémoire sans toucher au mock', fakeAsync(() => {
    service.changerStatut('tdb-1', 'Inactif').subscribe();
    tick(300);
    let statut = '';
    service.getById('tdb-1').subscribe((t) => (statut = t!.statut));
    tick(300);
    expect(statut).toBe('Inactif');
    expect(TABLEAUX_DE_BORD[0].statut).toBe('Actif');
  }));

  describe('création', () => {
    const saisie = { libelle: '  Nouveau  ', description: '', statut: 'Actif' as const, populationId: 'pop-1' };
    const creer = (depart: Parameters<TableauxDeBordService['create']>[1]) => {
      let cree: any;
      service.create(saisie, depart).subscribe((t) => (cree = t));
      tick(300);
      return cree;
    };

    it('crée toujours un tableau « Inactif », jamais prévisualisé, même si « Actif » est demandé', fakeAsync(() => {
      const t = creer({ type: 'vide' });
      expect(t.statut).toBe('Inactif');
      expect(t.previsualise).toBeFalse();
      expect(t.libelle).toBe('Nouveau');
      expect(t.creePar.nom).toBe('Absatou Diallo');
      expect(t.widgets).toEqual([]);
      expect(t.sections.length).toBe(6);
    }));

    it('V0 : pré-remplit les widgets courants, rangés dans la section de leur indicateur', fakeAsync(() => {
      const t = creer({ type: 'v0' });
      expect(t.widgets.map((w: any) => w.indicateurId)).toEqual(['ind-effectif-total', 'ind-repartition-site', 'ind-repartition-statut', 'ind-evolution-effectif', 'ind-turnover']);
      expect(t.widgets.map((w: any) => w.sectionId)).toEqual(['effectifs', 'effectifs', 'effectifs', 'mouvements', 'mouvements']);
    }));

    it('copie : reprend sections et widgets dans une copie indépendante', fakeAsync(() => {
      const t = creer({ type: 'copie', sourceId: 'tdb-3' });
      expect(t.widgets.length).toBe(3);
      expect(t.sections.find((s: any) => s.id === 'effectifs').libelle).toBe('Effectifs par pays');
      expect(t.widgets.every((w: any) => !['w-9', 'w-10', 'w-11'].includes(w.id))).toBeTrue();
      t.widgets[1].filtres.push('site:Paris');
      let source: any;
      service.getById('tdb-3').subscribe((s) => (source = s));
      tick(300);
      expect(source.widgets[1].filtres).toEqual(['filiale:France', "filiale:Côte d'Ivoire"]);
    }));
  });

  it("refuse en modification de passer « Actif » un tableau jamais prévisualisé", fakeAsync(() => {
    let erreur = '';
    service.update('tdb-4', { libelle: 'Performance DSI', description: '', statut: 'Actif', populationId: 'pop-3' }).subscribe({ error: (e: Error) => (erreur = e.message) });
    tick(300);
    expect(erreur).toContain('Prévisualisez');
  }));

  describe('composition', () => {
    const lire = () => {
      let t: any;
      service.getById('tdb-4').subscribe((x) => (t = x));
      tick(300);
      return t;
    };

    it('ajoute un widget dans la section de son indicateur, ou dans la section choisie', fakeAsync(() => {
      service.ajouterWidget('tdb-4', 'ind-conges').subscribe();
      tick(300);
      service.ajouterWidget('tdb-4', 'ind-conges', 'formation').subscribe();
      tick(300);
      expect(lire().widgets.slice(-2).map((w: any) => w.sectionId)).toEqual(['temps', 'formation']);
    }));

    it('ne stocke pas un titre identique au catalogue ; « Réinitialiser » revient au catalogue sans toucher aux filtres', fakeAsync(() => {
      service.modifierWidget('tdb-4', 'w-12', { titre: 'Entretiens annuels réalisés', description: ' Ma description ', sectionId: 'performance', filtres: ['site:Dakar'] }).subscribe();
      tick(300);
      let w = lire().widgets.find((x: any) => x.id === 'w-12');
      expect(w.titre).toBeUndefined();
      expect(w.description).toBe('Ma description');
      service.reinitialiserWidget('tdb-4', 'w-12').subscribe();
      tick(300);
      w = lire().widgets.find((x: any) => x.id === 'w-12');
      expect(w.description).toBeUndefined();
      expect(w.filtres).toEqual(['site:Dakar']);
    }));

    it('retire un widget et renomme une section pour ce tableau seulement', fakeAsync(() => {
      service.retirerWidget('tdb-4', 'w-13').subscribe();
      service.renommerSection('tdb-4', 'performance', '  Perf DSI ').subscribe();
      tick(300);
      const t = lire();
      expect(t.widgets.map((w: any) => w.id)).toEqual(['w-12']);
      expect(t.sections.find((s: any) => s.id === 'performance').libelle).toBe('Perf DSI');
      let autre: any;
      service.getById('tdb-1').subscribe((x) => (autre = x));
      tick(300);
      expect(autre.sections.find((s: any) => s.id === 'performance').libelle).toBe('Performance');
    }));

    it('refuse un nom de section vide', fakeAsync(() => {
      let erreur = '';
      service.renommerSection('tdb-4', 'performance', '  ').subscribe({ error: (e: Error) => (erreur = e.message) });
      tick(300);
      expect(erreur).toContain('obligatoire');
    }));

    it('rend le tableau activable une fois prévisualisé', fakeAsync(() => {
      service.marquerPrevisualise('tdb-4').subscribe();
      tick(300);
      let statut = '';
      service.changerStatut('tdb-4', 'Actif').subscribe((t) => (statut = t.statut));
      tick(300);
      expect(statut).toBe('Actif');
    }));
  });
});
