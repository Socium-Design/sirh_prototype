import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TableauxDeBordPageComponent } from './tableaux-de-bord-page.component';

describe('TableauxDeBordPageComponent', () => {
  let fixture: ComponentFixture<TableauxDeBordPageComponent>;
  const rows = () => [...fixture.nativeElement.querySelectorAll('tbody tr')] as HTMLElement[];
  const ligne = (libelle: string) => rows().find((r) => r.querySelector('td')?.textContent?.trim() === libelle)!;
  const cellules = (libelle: string) => [...ligne(libelle).querySelectorAll('td')].map((td) => td.textContent?.trim());
  /** Ouvre le menu d'actions d'une ligne (panneau rendu dans <body>, seul le panneau visible compte). */
  const action = (libelle: string, item: string) => {
    (ligne(libelle).querySelector('button[aria-label="Actions"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const panneau = [...document.body.querySelectorAll<HTMLElement>('[role="dialog"]')].find((p) => p.style.visibility === 'visible')!;
    return [...panneau.querySelectorAll('button[socMenuItem]')].find((b) => b.textContent?.includes(item)) as HTMLButtonElement | undefined;
  };

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(TableauxDeBordPageComponent);
    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();
  }));

  afterEach(() => fixture.destroy());

  it('liste les tableaux de bord avec population, statut, widgets et date de création', () => {
    expect(rows().length).toBe(4);
    expect(fixture.nativeElement.querySelector('soc-badge').textContent.trim()).toBe('4');
    expect([...fixture.nativeElement.querySelectorAll('th')].map((th: HTMLElement) => th.textContent?.trim())).toContain('Date de création');
    expect(cellules('Dashboard RH Global')).toEqual(jasmine.arrayContaining(['Équipe Sénégal', 'Actif', '6', '12/05/2026']));
    expect(ligne('Performance DSI').querySelector('soc-tag')?.textContent?.trim()).toBe('Inactif');
  });

  it('ouvre la création et la modification', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    ([...fixture.nativeElement.querySelectorAll('button')].find((b: HTMLElement) => b.textContent?.includes('Créer un tableau de bord')) as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith(['/workspace/configuration/tableaux-de-bord/nouveau']);
    action('Performance DSI', 'Modifier')!.click();
    expect(navigate).toHaveBeenCalledWith(['/workspace/configuration/tableaux-de-bord', 'tdb-4', 'modifier']);
  });

  it('« Voir détails » depuis le menu ou un clic sur la ligne', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    action('Performance DSI', 'Voir détails')!.click();
    expect(navigate).toHaveBeenCalledWith(['/workspace/configuration/tableaux-de-bord', 'tdb-4']);
    ligne('Dashboard RH Global').querySelector('td')!.click();
    expect(navigate).toHaveBeenCalledWith(['/workspace/configuration/tableaux-de-bord', 'tdb-1']);
  });

  it('recherche par libellé', () => {
    const input = fixture.nativeElement.querySelector('soc-search-bar input') as HTMLInputElement;
    input.value = 'masse';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(rows().map((r) => r.querySelector('td')?.textContent?.trim())).toEqual(['Dashboard masse salariale']);
  });

  it("désactive « Activer », avec info-bulle, tant que le tableau n'a pas été prévisualisé", () => {
    const activer = action('Performance DSI', 'Activer')!;
    expect(activer.disabled).toBeTrue();
    expect(activer.closest('soc-tooltip')).not.toBeNull();
    expect(document.body.textContent).toContain("Prévisualisez le tableau de bord avant de l'activer.");
  });

  it('active et désactive un tableau de bord', fakeAsync(() => {
    action('Dashboard RH Global', 'Désactiver')!.click();
    tick(500);
    fixture.detectChanges();
    expect(ligne('Dashboard RH Global').querySelector('soc-tag')?.textContent?.trim()).toBe('Inactif');

    action('Dashboard masse salariale', 'Activer')!.click();
    tick(500);
    fixture.detectChanges();
    expect(ligne('Dashboard masse salariale').querySelector('soc-tag')?.textContent?.trim()).toBe('Actif');
  }));
});
