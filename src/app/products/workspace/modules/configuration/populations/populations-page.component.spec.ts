import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { PopulationFormDialogComponent } from './components/population-form-dialog.component';
import { PopulationsPageComponent } from './populations-page.component';

describe('PopulationsPageComponent', () => {
  let fixture: ComponentFixture<PopulationsPageComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const rows = () => [...el().querySelectorAll('tbody tr')] as HTMLElement[];
  const ligne = (nom: string) => rows().find((r) => r.querySelector('td')?.textContent?.trim() === nom)!;
  const cellules = (nom: string) => [...ligne(nom).querySelectorAll('td')].map((td) => td.textContent?.trim());
  // Les panneaux de popover ont aussi role="dialog" : la modale est celle qui a aria-modal.
  const dialogue = () => document.body.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement | null;
  const boutonDialogue = (texte: string) => [...dialogue()!.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;
  const detecter = () => {
    fixture.detectChanges();
    tick(1000); // latence simulée des services, enchaînés (tableaux de bord puis populations)
    fixture.detectChanges();
  };

  /** Ouvre le menu ⋯ d'une ligne et renvoie l'item demandé (les panneaux restent dans <body> une fois fermés). */
  const action = (nom: string, libelle: string) => {
    (ligne(nom).querySelector('button[aria-label="Actions"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const panneau = [...document.body.querySelectorAll<HTMLElement>('[role="dialog"]')].find((p) => p.style.visibility === 'visible')!;
    return [...panneau.querySelectorAll('button[socMenuItem]')].find((b) => b.textContent?.includes(libelle)) as HTMLButtonElement;
  };

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(PopulationsPageComponent);
    detecter();
  }));

  afterEach(() => fixture.destroy());

  it('colonnes Nom | Description | Effectif concerné, bouton « Voir » et menu ⋯ Modifier / Supprimer', () => {
    expect(rows().length).toBe(7);
    expect([...el().querySelectorAll('thead th')].map((th) => th.textContent?.trim()).filter(Boolean)).toEqual(['Nom', 'Description', 'Effectif concerné']);
    expect(cellules('Équipe Sénégal').slice(0, 4)).toEqual(['Équipe Sénégal', 'Tous les collaborateurs de la filiale sénégalaise.', '12 personnes', 'Voir']);
    expect(cellules('Inactifs Dakar')[2]).toBe('0 personne');
    expect(action('Équipe Sénégal', 'Modifier')).toBeTruthy();
    expect(action('Fonctions support', 'Supprimer').disabled).toBeFalse();
    // Plus de colonnes Règles, Utilisée par, Créée par.
    expect(el().querySelector('thead')?.textContent).not.toContain('Créée par');
  });

  it('« Voir » ouvre le détail', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    (ligne('Fonctions support').querySelector('[data-testid="voir"]') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith(['/workspace/configuration/populations', 'pop-2']);
  });

  it('recherche par nom, avec un message quand rien ne correspond', () => {
    const input = el().querySelector('soc-search-bar input') as HTMLInputElement;
    input.value = 'inactifs';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(rows().map((r) => r.querySelector('td')?.textContent?.trim())).toEqual(['Collaborateurs inactifs', 'Inactifs Dakar']);

    input.value = 'introuvable';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(rows().length).toBe(0);
    expect(el().textContent).toContain('Aucune population ne correspond');
  });

  it('« Nouvelle population » ouvre la modale de création ; après création, message de succès', fakeAsync(() => {
    ([...el().querySelectorAll('button[socButton]')].find((b) => b.textContent?.includes('Nouvelle population')) as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(dialogue()?.textContent).toContain('Nouvelle population');

    const formulaire = fixture.debugElement.query(By.directive(PopulationFormDialogComponent)).componentInstance as unknown as Record<string, any>;
    formulaire['form'].controls.nom.setValue('Paris');
    formulaire['form'].controls.conditions.at(0).controls.valeurs.setValue(['Paris']);
    fixture.detectChanges();
    boutonDialogue('Créer la population').click();
    detecter();
    expect(dialogue()).toBeNull();
    expect(el().querySelector('[data-testid="message"]')?.textContent).toContain('Population créée avec succès');
    expect(cellules('Paris')[2]).toBe('5 personnes');
  }));

  it('« Modifier » ouvre la modale pré-remplie', () => {
    action('Fonctions support', 'Modifier').click();
    fixture.detectChanges();
    expect(dialogue()?.textContent).toContain('Modifier la population');
    expect((dialogue()!.querySelector('soc-input-text input') as HTMLInputElement).value).toBe('Fonctions support');
    expect(dialogue()!.querySelectorAll('[data-testid="condition"]').length).toBe(2);
  });

  it('population non utilisée : simple confirmation puis suppression', fakeAsync(() => {
    action('Inactifs Dakar', 'Supprimer').click();
    fixture.detectChanges();
    expect(dialogue()?.textContent).toContain('Supprimer la population ?');
    expect(dialogue()?.textContent).toContain('« Inactifs Dakar » sera définitivement supprimée.');
    boutonDialogue('Supprimer').click();
    detecter();
    expect(rows().length).toBe(6);
    expect(ligne('Inactifs Dakar')).toBeUndefined();
  }));

  it("population utilisée par un tableau de bord : modale d'impact, puis suppression", fakeAsync(() => {
    action('Équipe Sénégal', 'Supprimer').click();
    fixture.detectChanges();
    expect(dialogue()?.textContent).toContain('est utilisée dans les dashboards suivants');
    expect(dialogue()?.textContent).toContain('Dashboard RH Global');
    boutonDialogue('Supprimer quand même').click();
    detecter();
    expect(ligne('Équipe Sénégal')).toBeUndefined();
  }));
});
