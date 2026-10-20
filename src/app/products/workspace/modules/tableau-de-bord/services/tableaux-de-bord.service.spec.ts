import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TABLEAUX_DE_BORD } from '../../../../../../mocks/data/tableaux-de-bord.mock';
import type { TableauDeBord } from '../models/tableau-de-bord.model';
import { TableauxDeBordService } from './tableaux-de-bord.service';

describe('TableauxDeBordService', () => {
  let service: TableauxDeBordService;
  beforeEach(() => (service = TestBed.inject(TableauxDeBordService)));

  const lire = (id: string) => {
    let tableau: TableauDeBord | undefined;
    service.getById(id).subscribe((t) => (tableau = t));
    tick(300);
    return tableau;
  };

  it('crée un tableau pré-rempli par le modèle de base choisi', fakeAsync(() => {
    let cree: TableauDeBord | undefined;
    service.create({ libelle: '  Nouveau  ', description: '', statut: 'Inactif', produit: 'perfs', populationId: 'pop-1' }, 'manager').subscribe((t) => (cree = t));
    tick(300);
    expect(cree!.libelle).toBe('Nouveau');
    expect(cree!.modele).toBe('manager');
    expect(cree!.produit).toBe('perfs');
    expect(cree!.populationId).toBe('pop-1');
    expect('profils' in cree!).toBeFalse();
    expect(cree!.widgets.map((w) => w.indicateurId)).toEqual(['ind-effectif-total', 'ind-taux-absenteisme', 'ind-absences-motif', 'ind-turnover-departement']);
    expect(cree!.widgets.map((w) => w.sectionId)).toEqual(['capital-humain', 'absences', 'absences', 'mouvements']);
    expect(cree!.sections.length).toBe(6);
  }));

  it('gabarit vide : aucun graphe', fakeAsync(() => {
    let cree: TableauDeBord | undefined;
    service.create({ libelle: 'Vide', description: '', statut: 'Actif', produit: 'workspace', populationId: 'pop-1' }, 'vide').subscribe((t) => (cree = t));
    tick(300);
    expect(cree!.widgets).toEqual([]);
    expect(cree!.statut).toBe('Actif');
  }));

  it('met à jour les informations, en mémoire sans toucher au mock', fakeAsync(() => {
    service.update('tdb-1', { libelle: 'Renommé', description: 'd', statut: 'Inactif', produit: 'doc', populationId: 'pop-2' }).subscribe();
    tick(300);
    expect(lire('tdb-1')).toEqual(jasmine.objectContaining({ libelle: 'Renommé', statut: 'Inactif', produit: 'doc', populationId: 'pop-2' }));
    expect(TABLEAUX_DE_BORD[0].libelle).toBe('Admin RH Global');
  }));

  it('enregistre la composition (informations, produit, graphes, sections, statut)', fakeAsync(() => {
    const { libelle, description, populationId, sections } = lire('tdb-3')!;
    service
      .enregistrerComposition('tdb-3', { libelle: ` ${libelle} 2 `, description, produit: 'perfs', populationId, widgets: [], sections, statut: 'Archivé' })
      .subscribe();
    tick(300);
    expect(lire('tdb-3')).toEqual(jasmine.objectContaining({ libelle: `${libelle} 2`, produit: 'perfs', widgets: [], statut: 'Archivé' }));
  }));

  it('tableaux accessibles : ceux de la session, actifs et du produit demandé, dans l’ordre du menu', fakeAsync(() => {
    let accessibles: TableauDeBord[] = [];
    service.getAccessibles('workspace').subscribe((t) => (accessibles = t));
    tick(300);
    expect(accessibles.map((t) => t.libelle)).toEqual(['Admin RH Global', 'Mon équipe', 'Direction générale']);
    service.update('tdb-3', { libelle: 'Mon équipe', description: '', statut: 'Inactif', produit: 'workspace', populationId: 'pop-6' }).subscribe();
    tick(300);
    service.getAccessibles('workspace').subscribe((t) => (accessibles = t));
    tick(300);
    expect(accessibles.map((t) => t.id)).toEqual(['tdb-1', 'tdb-2']);
    service.getAccessibles('perfs').subscribe((t) => (accessibles = t));
    tick(300);
    expect(accessibles).toEqual([]);
  }));

  it('duplique en « X (copie) » avec de nouveaux identifiants de graphes', fakeAsync(() => {
    let copie: TableauDeBord | undefined;
    service.dupliquer('tdb-3').subscribe((t) => (copie = t));
    tick(300);
    expect(copie!.libelle).toBe('Mon équipe (copie)');
    expect(copie!.id).not.toBe('tdb-3');
    expect(copie!.widgets.length).toBe(4);
    expect(copie!.widgets.some((w) => TABLEAUX_DE_BORD[2].widgets.some((s) => s.id === w.id))).toBeFalse();
  }));

  it('supprime un tableau', fakeAsync(() => {
    service.remove('tdb-2').subscribe();
    tick(300);
    expect(lire('tdb-2')).toBeUndefined();
  }));

  it('modification de population : les tableaux décochés gardent la version figée', fakeAsync(() => {
    const anciennes = { combinaison: 'ET' as const, conditions: [{ champ: 'filiale' as const, operateur: 'est' as const, valeurs: ['Sénégal'] }] };
    service.appliquerModificationPopulation('pop-1', ['tdb-1'], anciennes).subscribe();
    tick(300);
    expect(lire('tdb-1')!.reglesFigees).toBeUndefined();
    expect(lire('tdb-2')!.reglesFigees).toEqual(anciennes);
  }));

  it('suppression de population : les tableaux cochés la perdent', fakeAsync(() => {
    service.retirerPopulation('pop-1', ['tdb-2']).subscribe();
    tick(300);
    expect(lire('tdb-2')!.populationId).toBeNull();
    expect(lire('tdb-1')!.populationId).toBe('pop-1');
  }));
});
