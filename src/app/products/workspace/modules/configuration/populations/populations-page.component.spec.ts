import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SocTag } from '@socium-design/angular-components';
import { Router, provideRouter } from '@angular/router';
import { PopulationsPageComponent } from './populations-page.component';

describe('PopulationsPageComponent', () => {
  let fixture: ComponentFixture<PopulationsPageComponent>;
  const rows = () => [...fixture.nativeElement.querySelectorAll('tbody tr')] as HTMLElement[];
  const ligne = (nom: string) => rows().find((r) => r.querySelector('td')?.textContent?.trim() === nom)!;
  const cellules = (nom: string) => [...ligne(nom).querySelectorAll('td')].map((td) => td.textContent?.trim());
  // Les panneaux de popover ont aussi role="dialog" : la modale est celle qui a aria-modal.
  const dialogue = () => document.body.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement | null;
  const boutonDialogue = (texte: string) => [...dialogue()!.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;

  /**
   * Ouvre le menu d'actions d'une ligne et renvoie l'item demandé. Les panneaux de menu sont rendus dans <body> et restent
   * dans le DOM une fois fermés (masqués) : on cherche dans le seul panneau visible.
   */
  const action = (nom: string, libelle: string) => {
    (ligne(nom).querySelector('button[aria-label="Actions"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const panneau = [...document.body.querySelectorAll<HTMLElement>('[role="dialog"]')].find((p) => p.style.visibility === 'visible')!;
    return [...panneau.querySelectorAll('button[socMenuItem]')].find((b) => b.textContent?.includes(libelle)) as HTMLButtonElement;
  };

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(PopulationsPageComponent);
    fixture.detectChanges();
    tick(300); // le service simule 200 ms de latence réseau
    fixture.detectChanges();
  }));

  afterEach(() => fixture.destroy());

  it('affiche les populations avec leur nombre total, sans template de page (contenu d’onglet)', () => {
    expect(rows().length).toBe(7);
    expect(fixture.nativeElement.querySelector('soc-badge').textContent.trim()).toBe('7');
    expect(fixture.nativeElement.querySelector('soc-data-table').textContent).toContain('Populations');
    expect(fixture.nativeElement.querySelector('soc-page-list, h1')).toBeNull();
  });

  it('calcule règles, employés couverts et usages', () => {
    expect(cellules('Équipe Sénégal').slice(2, 6)).toEqual(['1', '12', '3 éléments', 'Absatou Diallo']);
    expect(cellules('Fonctions support').slice(2, 5)).toEqual(['2', '14', '1 élément']);
    expect(cellules('RH Dakar').slice(2, 5)).toEqual(['2', '3', '—']);
  });

  it('affiche en rouge le compteur d’une population qui ne couvre personne', () => {
    const tag = fixture.debugElement.queryAll(By.directive(SocTag)).find((d) => ligne('Inactifs Dakar').contains(d.nativeElement))!;
    expect(tag.nativeElement.textContent.trim()).toBe('0');
    expect((tag.componentInstance as SocTag).color()).toBe('error');
    expect(ligne('RH Dakar').querySelectorAll('td')[3].querySelector('soc-tag')).toBeNull();
  });

  it('ouvre le détail depuis le menu ou un clic sur la ligne', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    action('RH Dakar', 'Voir détails').click();
    expect(navigate).toHaveBeenCalledWith(['/workspace/configuration/populations', 'pop-6']);
    ligne('Équipe Sénégal').querySelector('td')!.click();
    expect(navigate).toHaveBeenCalledWith(['/workspace/configuration/populations', 'pop-1']);
  });

  it('recherche par nom, avec un message quand rien ne correspond', () => {
    const input = fixture.nativeElement.querySelector('soc-search-bar input') as HTMLInputElement;
    input.value = 'rh dakar';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(rows().map((r) => r.querySelector('td')?.textContent?.trim())).toEqual(['RH Dakar']);

    input.value = 'introuvable';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(rows().length).toBe(0);
    expect(fixture.nativeElement.querySelector('soc-message').textContent).toContain('Aucune population ne correspond');
  });

  it('ouvre la création et la modification', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    ([...fixture.nativeElement.querySelectorAll('button[socButton]')].find((b: HTMLElement) => b.textContent?.includes('Créer une population')) as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith(['/workspace/configuration/populations/nouvelle']);
    action('RH Dakar', 'Modifier').click();
    expect(navigate).toHaveBeenCalledWith(['/workspace/configuration/populations', 'pop-6', 'modifier']);
  });

  it("désactive Supprimer, avec info-bulle, pour une population créée par quelqu'un d'autre", () => {
    const supprimer = action('DSI actifs hors Paris', 'Supprimer');
    expect(supprimer.disabled).toBeTrue();
    expect(supprimer.closest('soc-tooltip')).not.toBeNull();
    expect(document.body.textContent).toContain("Seule la personne qui l'a créée (Moussa Ndiaye) peut supprimer cette population.");
    expect(action('RH Dakar', 'Supprimer').disabled).toBeFalse();
  });

  it('population non utilisée : simple confirmation puis suppression', fakeAsync(() => {
    action('RH Dakar', 'Supprimer').click();
    fixture.detectChanges();
    expect(dialogue()?.textContent).toContain("n'est utilisée par aucun élément");
    boutonDialogue('Supprimer').click();
    tick(500); // suppression puis rechargement de la liste
    fixture.detectChanges();
    expect(rows().length).toBe(6);
    expect(ligne('RH Dakar')).toBeUndefined();
  }));

  it("population utilisée : modale d'impact ; les éléments décochés conservent la population", fakeAsync(() => {
    action('Équipe Sénégal', 'Supprimer').click();
    fixture.detectChanges();
    const cases = [...dialogue()!.querySelectorAll('[role="checkbox"]')] as HTMLButtonElement[];
    expect(cases.length).toBe(3);
    cases[0].click(); // « Dashboard RH Global » garde la population
    fixture.detectChanges();
    boutonDialogue('Supprimer').click();
    tick(500);
    fixture.detectChanges();
    expect(cellules('Équipe Sénégal')[4]).toBe('1 élément');

    action('Équipe Sénégal', 'Supprimer').click();
    fixture.detectChanges();
    boutonDialogue('Supprimer').click(); // tout coché : supprimée partout
    tick(500);
    fixture.detectChanges();
    expect(ligne('Équipe Sénégal')).toBeUndefined();
  }));
});
