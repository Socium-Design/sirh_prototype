import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TABLEAUX_DE_BORD } from '../../../../../../../mocks/data/tableaux-de-bord.mock';
import type { TableauDeBord } from '../../../tableau-de-bord/models/tableau-de-bord.model';
import { TableauDeBordDialogComponent } from './tableau-de-bord-dialog.component';

@Component({
  imports: [TableauDeBordDialogComponent],
  template: `<app-tableau-de-bord-dialog [open]="true" [tableau]="tableau()" (enregistre)="resultat = $event" (annule)="annule = true" />`,
})
class HoteComponent {
  readonly tableau = signal<TableauDeBord | null>(null);
  resultat: TableauDeBord | null = null;
  annule = false;
}

describe('TableauDeBordDialogComponent', () => {
  let fixture: ComponentFixture<HoteComponent>;
  const modale = () => document.body.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement;
  const bouton = (texte: string) => [...modale().querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;
  const detecter = () => {
    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();
  };
  const saisir = (index: number, texte: string) => {
    const input = modale().querySelectorAll<HTMLInputElement>('soc-input-text input')[index];
    input.value = texte;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  };
  const populations = () => [...modale().querySelectorAll('[data-testid="population"]')] as HTMLElement[];
  /** « Nom · N pers. » de chaque population proposée. */
  const lignesPopulations = () => populations().map((p) => `${p.querySelector('soc-radio-button')?.textContent?.trim()} · ${p.querySelector('.tableau__aide')?.textContent?.trim()}`);
  const choisirPopulation = (nom: string) => {
    (populations().find((p) => p.textContent?.includes(nom))!.querySelector('[role="radio"]') as HTMLElement).click();
    fixture.detectChanges();
  };

  const ouvrir = (tableau: TableauDeBord | null = null) => {
    fixture = TestBed.createComponent(HoteComponent);
    fixture.componentInstance.tableau.set(tableau);
    detecter();
  };

  afterEach(() => fixture.destroy());

  describe('création', () => {
    beforeEach(fakeAsync(() => ouvrir()));

    it('étape 1 « Information du tableau de bord » : champs, statut Inactif par défaut, populations avec leur effectif', () => {
      expect(modale().textContent).toContain('Nouveau tableau de bord');
      expect(modale().querySelector('soc-stepper')?.textContent).toContain('Information du tableau de bord');
      expect(modale().textContent).toContain('Nom du tableau de bord');
      expect(modale().textContent).toContain('Périmètre de données pris en compte dans tous les graphes de ce tableau de bord');
      expect(modale().querySelector('[role="tab"][aria-selected="true"]')?.textContent?.trim()).toBe('Inactif');
      expect(populations().length).toBe(7);
      expect(lignesPopulations()[0]).toBe('Équipe Sénégal · 12 pers.');
      expect(bouton('Annuler')).toBeTruthy();
    });

    it('exige un nom et une population', () => {
      bouton('Suivant').click();
      fixture.detectChanges();
      expect(modale().textContent).toContain('Le nom est obligatoire.');
      expect(modale().textContent).toContain('Choisissez la population du tableau de bord.');
      expect(modale().querySelector('[data-testid="recapitulatif"]')).toBeNull();
    });

    it('recherche une population', () => {
      const input = modale().querySelector('soc-search-bar input') as HTMLInputElement;
      input.value = 'inactifs';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();
      expect(lignesPopulations()).toEqual(['Collaborateurs inactifs · 3 pers.', 'Inactifs Dakar · 0 pers.']);
    });

    it('étape 2 « Point de départ » : 4 gabarits, Direction Générale par défaut, récapitulatif ; le gabarit choisi pré-remplit les graphes', fakeAsync(() => {
      saisir(0, 'Pilotage DSI');
      choisirPopulation('DSI actifs hors Paris');
      bouton('Suivant').click();
      fixture.detectChanges();
      const cartes = [...modale().querySelectorAll('[data-testid="gabarit"]')];
      expect(cartes.map((c) => c.querySelector('p')?.textContent?.trim())).toEqual(['Gabarit vide', 'Direction Générale', 'Admin RH', 'Manager']);
      expect(cartes[1].textContent).toContain('Sélectionné');
      const recap = modale().querySelector('[data-testid="recapitulatif"]')!.textContent!;
      expect(recap).toContain('RÉCAPITULATIF');
      expect(recap).toContain('Pilotage DSI');
      expect(recap).toContain('DSI actifs hors Paris');
      expect(recap).toContain('Direction Générale · 5 graphe(s)');

      (cartes[3] as HTMLElement).click();
      fixture.detectChanges();
      expect(modale().querySelector('[data-testid="recapitulatif"]')!.textContent).toContain('Manager · 4 graphe(s)');

      bouton('Retour').click();
      fixture.detectChanges();
      expect((modale().querySelector('soc-input-text input') as HTMLInputElement).value).toBe('Pilotage DSI');
      bouton('Suivant').click();
      fixture.detectChanges();
      bouton('Créer et composer').click();
      detecter();
      const cree = fixture.componentInstance.resultat!;
      expect(cree.libelle).toBe('Pilotage DSI');
      expect(cree.populationId).toBe('pop-3');
      expect(cree.statut).toBe('Inactif');
      expect(cree.modele).toBe('manager');
      expect(cree.widgets.length).toBe(4);
    }));
  });

  it('modification : pré-remplie, une seule étape, « Suivant — Modifier les indicateurs »', fakeAsync(() => {
    ouvrir(structuredClone(TABLEAUX_DE_BORD[2]));
    expect(modale().textContent).toContain('Modifier le tableau de bord');
    expect(modale().querySelector('soc-stepper')).toBeNull();
    expect((modale().querySelector('soc-input-text input') as HTMLInputElement).value).toBe('Dashboard Managers');
    expect(modale().querySelector('[role="tab"][aria-selected="true"]')?.textContent?.trim()).toBe('Actif');
    expect(populations().find((p) => p.textContent?.includes('Managers'))!.querySelector('[role="radio"]')?.getAttribute('aria-checked')).toBe('true');
    saisir(0, 'Dashboard Managers Dakar');
    bouton('Suivant — Modifier les indicateurs').click();
    detecter();
    expect(fixture.componentInstance.resultat?.libelle).toBe('Dashboard Managers Dakar');
    expect(fixture.componentInstance.resultat?.widgets.length).toBe(4);
  }));
});
