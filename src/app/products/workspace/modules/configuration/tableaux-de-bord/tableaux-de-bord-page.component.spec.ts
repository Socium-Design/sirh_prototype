import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TableauxDeBordPageComponent } from './tableaux-de-bord-page.component';

describe('TableauxDeBordPageComponent', () => {
  let fixture: ComponentFixture<TableauxDeBordPageComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const rows = () => [...el().querySelectorAll('tbody tr')] as HTMLElement[];
  const ligne = (nom: string) => rows().find((r) => r.querySelector('td')?.textContent?.trim() === nom)!;
  const cellules = (nom: string) => [...ligne(nom).querySelectorAll('td')].map((td) => td.textContent?.replace(/\s+/g, ' ').trim());
  const modale = () => document.body.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement | null;
  const boutonModale = (texte: string) => [...modale()!.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;
  const detecter = () => {
    fixture.detectChanges();
    tick(500);
    fixture.detectChanges();
  };
  const action = (nom: string, libelle: string) => {
    (ligne(nom).querySelector('button[aria-label="Actions"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const panneau = [...document.body.querySelectorAll<HTMLElement>('[role="dialog"]')].find((p) => p.style.visibility === 'visible')!;
    return [...panneau.querySelectorAll('button[socMenuItem]')].find((b) => b.textContent?.includes(libelle)) as HTMLButtonElement;
  };
  const rechercher = (texte: string) => {
    const input = el().querySelector('soc-search-bar input') as HTMLInputElement;
    input.value = texte;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  };

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(TableauxDeBordPageComponent);
    detecter();
  }));

  afterEach(() => fixture.destroy());

  it('colonnes Nom | Modèle de base | Profils | Statut | Date de création, boutons Détail et Visualiser', () => {
    expect(rows().length).toBe(5);
    expect([...el().querySelectorAll('thead th')].map((th) => th.textContent?.trim()).filter(Boolean)).toEqual(['Nom', 'Modèle de base', 'Profils', 'Statut', 'Date de création']);
    expect(cellules('Dashboard Direction Générale').slice(0, 2)).toEqual(['Dashboard Direction Générale', 'Direction Générale']);
    const pastilles = [...ligne('Dashboard Direction Générale').querySelectorAll('td')[2].querySelectorAll('soc-tag')].map((t) => t.textContent?.trim());
    expect(pastilles).toEqual(['Direction générale', 'Admin RH']);
    expect(cellules('Dashboard Direction Générale').slice(3, 5)).toEqual(['Actif', '03/06/2026']);
    expect(ligne('Dashboard Direction Générale').querySelector('[data-testid="detail"]')?.textContent?.trim()).toBe('Détail');
    expect(ligne('Dashboard Direction Générale').querySelector('[data-testid="visualiser"]')?.textContent?.trim()).toBe('Visualiser');
    expect(cellules('Dashboard masse salariale')[3]).toBe('Archivé');
    expect(cellules('Dashboard effectifs internationaux')[3]).toBe('Inactif');
    expect(el().querySelector('soc-search-bar input')?.getAttribute('placeholder')).toBe('Rechercher un tableau de bord...');
  });

  it('« Détail » ouvre la composition en lecture seule, « Visualiser » la consultation de ce tableau', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    (ligne('Dashboard Managers').querySelector('[data-testid="detail"]') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith(['/workspace/configuration/tableaux-de-bord', 'tdb-3']);
    (ligne('Dashboard Managers').querySelector('[data-testid="visualiser"]') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith(['/workspace/tableau-de-bord'], { queryParams: { tableau: 'tdb-3' } });
  });

  it('recherche, avec les deux états vides', () => {
    rechercher('managers');
    expect(rows().map((r) => r.querySelector('td')?.textContent?.trim())).toEqual(['Dashboard Managers']);
    rechercher('introuvable');
    expect(rows().length).toBe(0);
    expect(el().querySelector('[data-testid="vide"]')?.textContent).toContain('Aucun résultat pour cette recherche.');
  });

  it('« Dupliquer » crée « X (copie) »', fakeAsync(() => {
    action('Dashboard Managers', 'Dupliquer').click();
    detecter();
    expect(rows().length).toBe(6);
    expect(ligne('Dashboard Managers (copie)')).toBeTruthy();
  }));

  it('« Supprimer » : confirmation puis suppression ; liste vide → « Aucun tableau de bord configuré. »', fakeAsync(() => {
    action('Dashboard Managers', 'Supprimer').click();
    fixture.detectChanges();
    expect(modale()?.textContent).toContain('Supprimer le tableau de bord ?');
    expect(modale()?.textContent).toContain(
      '"Dashboard Managers" sera définitivement supprimé. Les utilisateurs concernés perdront l\'accès à ce tableau de bord.',
    );
    boutonModale('Supprimer').click();
    detecter();
    expect(ligne('Dashboard Managers')).toBeUndefined();

    for (const nom of rows().map((r) => r.querySelector('td')!.textContent!.trim())) {
      action(nom, 'Supprimer').click();
      fixture.detectChanges();
      boutonModale('Supprimer').click();
      detecter();
    }
    expect(el().querySelector('[data-testid="vide"]')?.textContent).toContain('Aucun tableau de bord configuré.');
  }));

  it('« Nouveau tableau de bord » ouvre la modale de création ; « Modifier » la modale pré-remplie', () => {
    ([...el().querySelectorAll('button[socButton]')].find((b) => b.textContent?.includes('Nouveau tableau de bord')) as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(modale()?.textContent).toContain('Nouveau tableau de bord');
    boutonModale('Annuler').click();
    fixture.detectChanges();
    expect(modale()).toBeNull();

    action('Dashboard Managers', 'Modifier').click();
    fixture.detectChanges();
    expect(modale()?.textContent).toContain('Modifier le tableau de bord');
  });
});
