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

  it('colonnes Libellé | Modèle de base | Produit | Population adressée | Statut | Date de création, sans profils ; boutons Détail et Visualiser', () => {
    expect(rows().length).toBe(5);
    expect([...el().querySelectorAll('thead th')].map((th) => th.textContent?.trim()).filter(Boolean)).toEqual([
      'Libellé',
      'Modèle de base',
      'Produit',
      'Population adressée',
      'Statut',
      'Date de création',
    ]);
    expect(cellules('Direction générale').slice(0, 6)).toEqual(['Direction générale', 'Direction Générale', 'Workspace', 'Équipe Sénégal', 'Actif', '3 juin 2026']);
    expect(cellules('Mon équipe').slice(2, 4)).toEqual(['Workspace', 'Managers – périmètre hiérarchique']);
    expect(cellules('Dashboard effectifs internationaux').slice(2, 5)).toEqual(['Perf', 'Filiales hors Sénégal', 'Inactif']);
    expect(cellules('Dashboard masse salariale')[4]).toBe('Inactif');
    expect(el().textContent).not.toContain('Profils');
    // Comme le Figma Make : pas de titre de section, coche sur « Actif », icônes sur Détail et Visualiser.
    expect(el().querySelector('soc-badge')).toBeNull();
    expect(ligne('Direction générale').querySelector('app-statut-tableau svg')).not.toBeNull();
    expect(ligne('Dashboard masse salariale').querySelector('app-statut-tableau svg')).toBeNull();
    expect(ligne('Direction générale').querySelectorAll('[data-testid="detail"] svg, [data-testid="visualiser"] svg').length).toBe(2);
    expect(ligne('Direction générale').querySelector('[data-testid="detail"]')?.textContent?.trim()).toBe('Détail');
    expect(ligne('Direction générale').querySelector('[data-testid="visualiser"]')?.textContent?.trim()).toBe('Visualiser');
    expect(el().querySelector('soc-search-bar input')?.getAttribute('placeholder')).toBe('Rechercher un tableau de bord...');
  });

  it('« Détail » ouvre la composition en lecture seule, « Visualiser » la consultation de ce tableau', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    (ligne('Mon équipe').querySelector('[data-testid="detail"]') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith(['/workspace/configuration/tableaux-de-bord', 'tdb-3']);
    (ligne('Mon équipe').querySelector('[data-testid="visualiser"]') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith(['/workspace/tableau-de-bord'], { queryParams: { tableau: 'tdb-3' } });
  });

  it('recherche, avec les deux états vides', () => {
    rechercher('équipe');
    expect(rows().map((r) => r.querySelector('td')?.textContent?.trim())).toEqual(['Mon équipe']);
    rechercher('introuvable');
    expect(rows().length).toBe(0);
    expect(el().querySelector('[data-testid="vide"]')?.textContent).toContain('Aucun résultat pour cette recherche.');
  });

  it('« Dupliquer » crée « X (copie) »', fakeAsync(() => {
    action('Mon équipe', 'Dupliquer').click();
    detecter();
    expect(rows().length).toBe(6);
    expect(ligne('Mon équipe (copie)')).toBeTruthy();
  }));

  it('« Supprimer » : confirmation puis suppression ; liste vide → « Aucun tableau de bord configuré. »', fakeAsync(() => {
    action('Mon équipe', 'Supprimer').click();
    fixture.detectChanges();
    expect(modale()?.textContent).toContain('Supprimer le tableau de bord ?');
    expect(modale()?.textContent).toContain(
      '"Mon équipe" sera définitivement supprimé. Les utilisateurs concernés perdront l\'accès à ce tableau de bord.',
    );
    boutonModale('Supprimer').click();
    detecter();
    expect(ligne('Mon équipe')).toBeUndefined();

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

    action('Mon équipe', 'Modifier').click();
    fixture.detectChanges();
    expect(modale()?.textContent).toContain('Modifier le tableau de bord');
  });
});
