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

  /** Liste déroulante « Produit » : ouvre le panneau du kit, renvoie ses options ou clique sur l'une d'elles. */
  const panneauOuvert = () => [...document.body.querySelectorAll<HTMLElement>('[role="dialog"]:not([aria-modal])')].find((p) => p.style.visibility === 'visible');
  const optionsProduits = () => {
    (modale().querySelector('[data-testid="produit"] button') as HTMLButtonElement).click();
    fixture.detectChanges();
    return [...panneauOuvert()!.querySelectorAll('button')].map((b) => b.textContent?.trim());
  };
  const choisirProduit = (libelle: string) => {
    optionsProduits();
    ([...panneauOuvert()!.querySelectorAll('button')].find((b) => b.textContent?.trim() === libelle) as HTMLButtonElement).click();
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

    it('étape 1 « Information du tableau de bord » : libellé, description, statut Inactif par défaut, produit, population adressée avec effectif', () => {
      expect(modale().textContent).toContain('Nouveau tableau de bord');
      expect(modale().querySelector('soc-stepper')?.textContent).toContain('Information du tableau de bord');
      expect(modale().textContent).toContain('Libellé');
      expect(modale().textContent).toContain('Produit');
      expect(modale().textContent).toContain('Population adressée');
      expect(modale().textContent).toContain('Les personnes qui verront ce tableau de bord.');
      expect(modale().textContent).not.toContain('Profil');
      expect(modale().querySelector('[role="tab"][aria-selected="true"]')?.textContent?.trim()).toBe('Inactif');
      expect(populations().length).toBe(7);
      expect(lignesPopulations()[0]).toBe('Équipe Sénégal · 12 pers.');
      expect(bouton('Annuler')).toBeTruthy();
    });

    it('produit : seuls les produits souscrits sont proposés', () => {
      expect(optionsProduits()).toEqual(['Workspace', 'Perf', 'Workflow', 'Doc']);
    });

    it('exige un libellé, un produit et une population adressée', () => {
      bouton('Suivant').click();
      fixture.detectChanges();
      expect(modale().textContent).toContain('Le libellé est obligatoire.');
      expect(modale().textContent).toContain('Choisissez le produit du tableau de bord.');
      expect(modale().textContent).toContain('Choisissez la population adressée.');
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
      choisirProduit('Perf');
      choisirPopulation('DSI actifs hors Paris');
      bouton('Suivant').click();
      fixture.detectChanges();
      const cartes = [...modale().querySelectorAll('[data-testid="gabarit"]')];
      expect(cartes.map((c) => c.querySelector('p')?.textContent?.trim())).toEqual(['Gabarit vide', 'Direction Générale', 'Admin RH', 'Manager']);
      expect(cartes[1].textContent).toContain('Sélectionné');
      const recap = modale().querySelector('[data-testid="recapitulatif"]')!.textContent!;
      expect(recap).toContain('RÉCAPITULATIF');
      expect(recap).toContain('Pilotage DSI');
      expect(recap).toContain('ProduitPerf');
      expect(recap).toContain('Population adresséeDSI actifs hors Paris');
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
      expect(cree.produit).toBe('perfs');
      expect(cree.statut).toBe('Inactif');
      expect(cree.modele).toBe('manager');
      expect(cree.widgets.length).toBe(4);
    }));
  });

  it('modification : pré-remplie, une seule étape, « Suivant — Modifier les indicateurs »', fakeAsync(() => {
    ouvrir(structuredClone(TABLEAUX_DE_BORD[2]));
    expect(modale().textContent).toContain('Modifier le tableau de bord');
    expect(modale().querySelector('soc-stepper')).toBeNull();
    expect((modale().querySelector('soc-input-text input') as HTMLInputElement).value).toBe('Mon équipe');
    expect(modale().querySelector('[role="tab"][aria-selected="true"]')?.textContent?.trim()).toBe('Actif');
    expect(modale().querySelector('[data-testid="produit"]')?.textContent).toContain('Workspace');
    expect(populations().find((p) => p.textContent?.includes('Managers'))!.querySelector('[role="radio"]')?.getAttribute('aria-checked')).toBe('true');
    saisir(0, 'Mon équipe Dakar');
    bouton('Suivant — Modifier les indicateurs').click();
    detecter();
    expect(fixture.componentInstance.resultat?.libelle).toBe('Mon équipe Dakar');
    expect(fixture.componentInstance.resultat?.widgets.length).toBe(4);
  }));
});
