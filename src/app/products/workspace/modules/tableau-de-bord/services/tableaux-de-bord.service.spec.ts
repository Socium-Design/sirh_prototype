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
});
