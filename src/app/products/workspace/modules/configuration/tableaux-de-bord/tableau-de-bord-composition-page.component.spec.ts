import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TableauxDeBordService } from '../../tableau-de-bord/services/tableaux-de-bord.service';
import { TableauDeBordCompositionPageComponent } from './tableau-de-bord-composition-page.component';

type Page = Record<string, any>;

describe('TableauDeBordCompositionPageComponent', () => {
  let fixture: ComponentFixture<TableauDeBordCompositionPageComponent>;
  let page: Page;
  const el = () => fixture.nativeElement as HTMLElement;
  const widgets = () => [...el().querySelectorAll('[data-testid="widget"]')] as HTMLElement[];
  const titresWidgets = () => widgets().map((w) => w.querySelector('soc-card p')?.textContent?.trim());
  const sections = () => [...el().querySelectorAll('[data-testid="section"]')].map((s) => s.querySelector('.section__titre')?.textContent?.trim() + ' · ' + s.querySelector('soc-badge')?.textContent?.trim());
  const ligne = (titre: string) =>
    [...el().querySelectorAll('[data-testid="indicateur"], [data-testid="indicateur-indisponible"]')].find((c) => c.textContent?.includes(titre)) as HTMLElement;
  const modale = () => document.body.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement | null;
  const rafraichir = () => {
    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();
  };
  const panneauVisible = () => [...document.body.querySelectorAll<HTMLElement>('[role="dialog"]:not([aria-modal])')].find((p) => p.style.visibility === 'visible')!;
  const menu = (titre: string, item: string) => {
    (widgets().find((w) => w.textContent?.includes(titre))!.querySelector('button[aria-label^="Actions du graphe"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    return [...panneauVisible().querySelectorAll('button[socMenuItem]')].find((b) => b.textContent?.includes(item)) as HTMLButtonElement;
  };

  const ouvrir = (id: string, mode: 'edition' | 'lecture' = 'edition') => {
    const query = convertToParamMap(mode === 'edition' ? { mode } : {});
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id }), queryParamMap: query }, queryParamMap: of(query) } }],
    });
    fixture = TestBed.createComponent(TableauDeBordCompositionPageComponent);
    page = fixture.componentInstance as unknown as Page;
    rafraichir();
  };

  afterEach(() => fixture.destroy());

  describe('Détail (lecture seule)', () => {
    beforeEach(fakeAsync(() => ouvrir('tdb-3', 'lecture')));

    it('badge « Lecture seule », informations à gauche, graphes par section, sans Bibliothèque ni menus', () => {
      expect(el().querySelector('h1')?.textContent).toContain('Dashboard Managers');
      expect(el().querySelector('soc-tag')?.textContent?.trim()).toBe('Lecture seule');
      const infos = el().querySelector('[data-testid="infos"]')!.textContent!;
      for (const texte of ['INFORMATIONS', 'Libellé', 'Description', 'Population', 'Managers – périmètre hiérarchique', 'Statut', 'Actif', 'Profils', 'Manager']) {
        expect(infos).withContext(texte).toContain(texte);
      }
      expect(el().textContent).toContain('Composition du dashboard · 4 graphe(s)');
      expect(sections()).toEqual(['Gestion du capital humain · 1 KPI', 'Mouvement du personnel · 1 KPI', 'Absences de mon équipe · 2 KPI']);
      expect(el().querySelector('[data-testid="bibliotheque"]')).toBeNull();
      expect(el().querySelector('button[aria-label^="Actions du graphe"]')).toBeNull();
      expect(widgets()[0].textContent).toContain('Aucun filtre');
    });

    it('« Modifier » passe en édition (dans l’URL)', () => {
      const navigate = spyOn(TestBed.inject(Router), 'navigate');
      (el().querySelector('[data-testid="modifier"]') as HTMLButtonElement).click();
      expect(navigate).toHaveBeenCalledWith([], jasmine.objectContaining({ queryParams: { mode: 'edition' } }));
    });
  });

  describe('édition', () => {
    beforeEach(fakeAsync(() => ouvrir('tdb-3')));

    it('indication, Bibliothèque par sections avec compteur, ✓ si ajouté, cadenas si non souscrit', () => {
      expect(el().textContent).toContain('Ajouter des graphes depuis la bibliothèque →');
      const entetes = [...el().querySelectorAll('[data-testid="section-bibliotheque"]')].map((s) => s.textContent!.replace(/\s+/g, ' '));
      expect(entetes.length).toBe(5);
      expect(entetes[0]).toContain('Gestion du capital humain');
      expect(el().querySelector('[data-testid="compteur"]')?.textContent?.trim()).toBe('1/4');
      expect(ligne('Effectif total').querySelector('[aria-label="Effectif total ajouté"]')).not.toBeNull();
      expect(ligne('Pyramide des âges').querySelector('[aria-label="Ajouter Pyramide des âges"]')).not.toBeNull();
      expect(ligne('Coût moyen par embauche').getAttribute('data-testid')).toBe('indicateur-indisponible');
      expect(ligne('Coût moyen par embauche').textContent).toContain('Produit non souscrit');
    });

    it('« + » ajoute le graphe dans la section de son indicateur', fakeAsync(() => {
      (ligne('Pyramide des âges').querySelector('[aria-label="Ajouter Pyramide des âges"]') as HTMLButtonElement).click();
      rafraichir();
      expect(widgets().length).toBe(5);
      expect(sections()[0]).toBe('Gestion du capital humain · 2 KPI');
      expect(ligne('Pyramide des âges').querySelector('[aria-label="Pyramide des âges ajouté"]')).not.toBeNull();
    }));

    it('glisser-déposer : ajoute l’indicateur déposé dans la composition', fakeAsync(() => {
      const composition = { data: null };
      page['deposer']({ item: { data: 'ind-masse-salariale' }, previousContainer: {}, container: composition } as unknown as CdkDragDrop<unknown, unknown, string>);
      rafraichir();
      expect(titresWidgets()).toContain('Masse salariale mensuelle');
    }));

    it('recherche dans la Bibliothèque', () => {
      const input = el().querySelector('[data-testid="bibliotheque"] soc-search-bar input') as HTMLInputElement;
      input.value = 'turnover';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();
      expect([...el().querySelectorAll('[data-testid="indicateur"]')].map((l) => l.querySelector('.ligne__nom')?.textContent?.trim())).toEqual([
        'Turnover global',
        'Turnover par département',
      ]);
    });

    it('renomme une section directement (Entrée valide, Échap annule)', () => {
      (el().querySelector('[aria-label="Renommer cette section"]') as HTMLButtonElement).click();
      fixture.detectChanges();
      const champ = () => el().querySelector('[data-testid="renommage"]') as HTMLElement;
      const input = champ().querySelector('input') as HTMLInputElement;
      input.value = 'Mon équipe';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();
      expect(champ()).toBeNull();
      expect(sections()[0]).toBe('Gestion du capital humain · 1 KPI');

      (el().querySelector('[aria-label="Renommer cette section"]') as HTMLButtonElement).click();
      fixture.detectChanges();
      const input2 = champ().querySelector('input') as HTMLInputElement;
      input2.value = 'Mon équipe';
      input2.dispatchEvent(new Event('input', { bubbles: true }));
      input2.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      fixture.detectChanges();
      expect(sections()[0]).toBe('Mon équipe · 1 KPI');
    });

    it('menu d’un graphe : « Retirer »', () => {
      menu("Taux d'absentéisme", 'Retirer').click();
      fixture.detectChanges();
      expect(titresWidgets()).not.toContain("Taux d'absentéisme");
    });

    it('menu d’un graphe : « Modifier » ouvre « Modifier le KPI » et applique titre et filtres', () => {
      menu('Effectif total', 'Modifier').click();
      fixture.detectChanges();
      expect(modale()?.textContent).toContain('Modifier le KPI');
      expect(modale()?.textContent).toContain('Rechercher et sélectionner des filtres');
      const dialogue = page['widgetEdite']();
      expect(dialogue.titre).toBe('Effectif total');
      page['sauverWidget']({ titre: 'Effectif de l’équipe', description: '', sectionId: 'capital-humain', filtres: ['site:Dakar'] });
      fixture.detectChanges();
      expect(modale()).toBeNull();
      const carte = widgets().find((w) => w.textContent?.includes('Effectif de l’équipe'))!;
      expect(carte.textContent).toContain('Site : Dakar');
    });

    it('statut et profils modifiables ; « Enregistrer » persiste puis affiche « Enregistré ✓ »', fakeAsync(() => {
      const service = TestBed.inject(TableauxDeBordService);
      const enregistrer = spyOn(service, 'enregistrerComposition').and.callThrough();
      ([...el().querySelectorAll('[data-testid="infos"] soc-checkbox')].find((c) => c.textContent?.includes('Administrateur RH'))!.querySelector('[role="checkbox"]') as HTMLElement).click();
      fixture.detectChanges();
      expect(page['brouillon']().profils).toEqual(['admin-rh', 'manager']);
      page['changerStatut']('Inactif');
      fixture.detectChanges();

      const bouton = () => el().querySelector('[data-testid="enregistrer"]') as HTMLButtonElement;
      expect(bouton().getAttribute('aria-label')).toBe('Enregistrer');
      bouton().click();
      rafraichir();
      expect(enregistrer).toHaveBeenCalledWith('tdb-3', jasmine.objectContaining({ statut: 'Inactif', profils: ['admin-rh', 'manager'] }));
      expect(bouton().getAttribute('aria-label')).toBe('Enregistré ✓');

      (ligne('Pyramide des âges').querySelector('[aria-label="Ajouter Pyramide des âges"]') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(bouton().getAttribute('aria-label')).toBe('Enregistrer');
    }));

    it('quitter sans changement : pas de confirmation', () => {
      expect(page['peutQuitter']()).toBeTrue();
      expect(modale()).toBeNull();
    });

    it('changements non enregistrés : « Quitter sans enregistrer ? », Rester ou Quitter', fakeAsync(() => {
      (ligne('Pyramide des âges').querySelector('[aria-label="Ajouter Pyramide des âges"]') as HTMLButtonElement).click();
      fixture.detectChanges();
      const reponses: boolean[] = [];
      const bouton = (texte: string) => [...modale()!.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;

      page['peutQuitter']().subscribe((r: boolean) => reponses.push(r));
      fixture.detectChanges();
      expect(modale()?.textContent).toContain('Quitter sans enregistrer ?');
      expect(modale()?.textContent).toContain("Les modifications de « Dashboard Managers » n'ont pas été enregistrées.");
      bouton('Rester sur la page').click();
      fixture.detectChanges();
      expect(reponses).toEqual([false]);
      expect(modale()).toBeNull();

      page['peutQuitter']().subscribe((r: boolean) => reponses.push(r));
      fixture.detectChanges();
      bouton('Quitter sans enregistrer').click();
      expect(reponses).toEqual([false, true]);

      // Une fois enregistré, plus de confirmation ; annuler un changement aussi.
      (el().querySelector('[data-testid="enregistrer"]') as HTMLButtonElement).click();
      rafraichir();
      expect(page['peutQuitter']()).toBeTrue();
    }));

    it('revenir à l’état enregistré lève la confirmation', () => {
      (ligne('Pyramide des âges').querySelector('[aria-label="Ajouter Pyramide des âges"]') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(page['modifie']()).toBeTrue();
      menu('Pyramide des âges', 'Retirer').click();
      fixture.detectChanges();
      expect(page['peutQuitter']()).toBeTrue();
    });

    it('« Prévisualiser » : plein écran, KPI en haut puis graphes sur 2 colonnes, données simulées', () => {
      (el().querySelector('[data-testid="previsualiser"]') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(el().textContent).toContain('Prévisualisation · Managers – périmètre hiérarchique · 4 KPIs');
      expect(el().textContent).toContain('Données simulées');
      const grilles = el().querySelectorAll('[data-testid="apercu"] soc-card-grid');
      expect(grilles.length).toBe(2);
      expect(grilles[0].querySelectorAll('app-widget-carte').length).toBe(1);
      expect(grilles[1].querySelectorAll('app-widget-carte').length).toBe(3);
      expect(el().textContent).toContain('Retour à la composition');
    });
  });

  it('composition vide : invite à cliquer dans la bibliothèque ; prévisualisation vide', fakeAsync(() => {
    ouvrir('tdb-3');
    page['brouillon'].update((t: any) => ({ ...t, widgets: [] }));
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="composition-vide"]')?.textContent).toContain('Cliquez sur un graphe dans la bibliothèque →');
    page['apercu'].set(true);
    fixture.detectChanges();
    expect(el().textContent).toContain('Aucun KPI ajouté — retournez à la bibliothèque pour en ajouter.');
  }));

  it('revient à la liste si le tableau n’existe pas', fakeAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'x' }), queryParamMap: convertToParamMap({}) }, queryParamMap: of(convertToParamMap({})) } }],
    });
    const navigate = spyOn(TestBed.inject(Router), 'navigateByUrl');
    fixture = TestBed.createComponent(TableauDeBordCompositionPageComponent);
    rafraichir();
    expect(navigate).toHaveBeenCalledWith('/workspace/configuration/tableaux-de-bord');
  }));
});
