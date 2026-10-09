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
  const saisir = (champ: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, valeur: string, evenement = 'input') => {
    champ.value = valeur;
    champ.dispatchEvent(new Event(evenement, { bubbles: true }));
    fixture.detectChanges();
  };
  const apercu = () => document.body.querySelector('soc-labs-fullscreen-overlay [role="dialog"], [role="dialog"][aria-modal="true"]:has([data-testid="apercu"])') as HTMLElement | null;
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
      expect(el().querySelector('soc-tag[socLabsWorkspaceHint]')?.textContent?.trim()).toBe('Lecture seule');
      expect(el().textContent).not.toContain('Ajouter des graphes depuis la bibliothèque');
      const infos = el().querySelector('[data-testid="infos"]')!.textContent!;
      for (const texte of ['INFORMATIONS', 'Libellé', 'Description', 'Population', 'Managers – périmètre hiérarchique', 'Statut', 'Actif', 'Profils', 'Manager']) {
        expect(infos).withContext(texte).toContain(texte);
      }
      expect(el().textContent).toContain('Composition du dashboard · 4 graphe(s)');
      expect(sections()).toEqual(['Gestion du capital humain · 1 KPI', 'Mouvement du personnel · 1 KPI', 'Absences de mon équipe · 2 KPI']);
      expect(el().querySelector('[data-testid="bibliotheque"]')).toBeNull();
      expect(el().querySelector('button[aria-label^="Actions du graphe"]')).toBeNull();
      expect(widgets()[0].textContent).toContain('Aucun filtre');
      expect(widgets()[0].querySelector('soc-labs-chart-type-chip')).not.toBeNull();
      // Description entière (coupée à 2 lignes en CSS), pas de sous-titre tronqué à 96 caractères.
      const description = widgets()[0].querySelector('[data-testid="description"]') as HTMLElement;
      expect(description.textContent?.trim()).toBe('Nombre de collaborateurs actifs à date dans le périmètre du tableau de bord.');
      expect(getComputedStyle(description).webkitLineClamp).toBe('2');
      expect(el().querySelector('soc-labs-drop-zone')).toBeNull();
    });

    it('informations en texte, statut en une pastille, profils en pastilles, « Modifier » principal et « Prévisualiser » secondaire', () => {
      const infos = el().querySelector('[data-testid="infos"]')!;
      expect(infos.querySelectorAll('input, textarea, select').length).toBe(0);
      const statut = infos.querySelector('[data-testid="statut"]')!;
      expect(statut.tagName).toBe('SOC-TAG');
      expect(statut.textContent?.trim()).toBe('Actif');
      expect(infos.querySelector('soc-labs-pill-toggle')).toBeNull();
      expect([...infos.querySelectorAll('[data-testid="profils"] soc-tag')].map((t) => t.textContent?.trim())).toEqual(['Manager']);
      expect(infos.querySelector('soc-checkbox')).toBeNull();
      const previsualiser = el().querySelector('[data-testid="previsualiser"]') as HTMLElement;
      const modifier = el().querySelector('[data-testid="modifier"]') as HTMLElement;
      expect(previsualiser.textContent?.trim()).toBe('Prévisualiser');
      expect(previsualiser.querySelector('svg[lucideEye]')).not.toBeNull();
      expect(modifier.textContent?.trim()).toBe('Modifier');
      expect(modifier.querySelector('svg[lucidePencil]')).not.toBeNull();
      expect(modifier.className).toContain('bg-primary-default');
      expect(previsualiser.className).toContain('bg-secondary-default');
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
      // Compteur des graphes ajoutés : seulement pour les sections qui en ont.
      expect([...el().querySelectorAll('[data-testid="compteur"]')].map((c) => c.textContent?.trim())).toEqual(['1', '1', '2']);
      expect(ligne('Effectif total').querySelector('[aria-label="Effectif total ajouté"]')).not.toBeNull();
      expect(ligne('Pyramide des âges').querySelector('[aria-label="Ajouter Pyramide des âges"]')).not.toBeNull();
      expect(ligne('Coût moyen par embauche').getAttribute('data-testid')).toBe('indicateur-indisponible');
      expect(ligne('Coût moyen par embauche').textContent).toContain('Produit non souscrit');
      expect(ligne('Effectif total').querySelector('soc-labs-chart-type-chip')).not.toBeNull();
    });

    it('une section de la Bibliothèque se replie et se déplie', () => {
      const lignes = () => el().querySelectorAll('[data-testid="bibliotheque"] soc-labs-list-row').length;
      const avant = lignes();
      (el().querySelector('[data-testid="bibliotheque"] button[aria-label="Replier Gestion du capital humain"]') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(lignes()).toBe(avant - 4);
      (el().querySelector('[data-testid="bibliotheque"] button[aria-label="Déplier Gestion du capital humain"]') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(lignes()).toBe(avant);
    });

    it('libellé, description et population modifiables ; « Enregistrer » les persiste', fakeAsync(() => {
      const service = TestBed.inject(TableauxDeBordService);
      const enregistrer = spyOn(service, 'enregistrerComposition').and.callThrough();
      saisir(el().querySelector('[data-testid="libelle"] input') as HTMLInputElement, 'Dashboard Managers Dakar');
      expect(el().querySelector('h1')?.textContent).toContain('Dashboard Managers Dakar');
      saisir(el().querySelector('[data-testid="description"] textarea') as HTMLTextAreaElement, 'Équipes de Dakar.');
      const population = el().querySelector('[data-testid="population"] select') as HTMLSelectElement;
      saisir(population, population.options[0].value, 'change');
      expect(page['modifie']()).toBeTrue();
      (el().querySelector('[data-testid="enregistrer"]') as HTMLButtonElement).click();
      rafraichir();
      expect(enregistrer).toHaveBeenCalledWith(
        'tdb-3',
        jasmine.objectContaining({ libelle: 'Dashboard Managers Dakar', description: 'Équipes de Dakar.', populationId: population.options[0].value }),
      );
      expect(page['peutQuitter']()).toBeTrue();
    }));

    it('libellé vide : « Enregistrer » désactivé', () => {
      saisir(el().querySelector('[data-testid="libelle"] input') as HTMLInputElement, '  ');
      expect((el().querySelector('[data-testid="enregistrer"]') as HTMLButtonElement).disabled).toBeTrue();
    });

    it('zone de dépôt : emplacement permanent sous les graphes ; un clic amène à la recherche de la Bibliothèque', () => {
      const emplacement = el().querySelector('[data-testid="emplacement"]')!;
      expect(emplacement.textContent).toContain('Ajouter un graphe depuis la bibliothèque');
      (emplacement.querySelector('button') as HTMLButtonElement).click();
      expect(document.activeElement).toBe(el().querySelector('[data-testid="bibliotheque"] soc-search-bar input'));
    });

    it('pendant le glisser, toute la zone de composition se met en évidence', () => {
      page['survol'].set(true);
      fixture.detectChanges();
      expect(el().querySelector('[data-testid="composition"]')!.classList).toContain('composition--survol');
      page['deposer']({ item: { data: 'x' }, previousContainer: {}, container: {} } as unknown as CdkDragDrop<unknown, unknown, string>);
      fixture.detectChanges();
      expect(el().querySelector('[data-testid="composition"]')!.classList).not.toContain('composition--survol');
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
      expect([...el().querySelectorAll('[data-testid="indicateur"]')].map((l) => l.textContent)).toEqual([
        jasmine.stringContaining('Turnover global'),
        jasmine.stringContaining('Turnover par département'),
      ]);
    });

    it('renomme une section sur place dans la Bibliothèque (Entrée valide, Échap annule)', () => {
      const nom = () => el().querySelector('[data-testid="nom-section"]') as HTMLElement;
      const editer = (valeur: string, touche: string) => {
        (nom().querySelector('button') as HTMLButtonElement).click();
        fixture.detectChanges();
        const input = nom().querySelector('input') as HTMLInputElement;
        input.value = valeur;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keydown', { key: touche, bubbles: true }));
        fixture.detectChanges();
      };
      editer('Mon équipe', 'Escape');
      expect(nom().querySelector('input')).toBeNull();
      expect(sections()[0]).toBe('Gestion du capital humain · 1 KPI');

      editer('Mon équipe', 'Enter');
      expect(sections()[0]).toBe('Mon équipe · 1 KPI');
      expect(nom().textContent).toContain('Mon équipe');
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

    it('statut modifiable (pastilles), profils en pastilles seules ; « Enregistrer » persiste puis affiche « Enregistré ✓ »', fakeAsync(() => {
      const service = TestBed.inject(TableauxDeBordService);
      const enregistrer = spyOn(service, 'enregistrerComposition').and.callThrough();
      expect(el().querySelector('[data-testid="infos"] soc-checkbox')).toBeNull();
      expect(el().querySelector('[data-testid="profils"]')?.textContent?.trim()).toBe('Manager');
      ([...el().querySelectorAll('[data-testid="statut"] [role="radio"]')].find((r) => r.textContent?.trim() === 'Inactif') as HTMLElement).click();
      fixture.detectChanges();
      expect(page['brouillon']().statut).toBe('Inactif');

      const bouton = () => el().querySelector('[data-testid="enregistrer"]') as HTMLButtonElement;
      expect(bouton().textContent?.trim()).toBe('Enregistrer');
      bouton().click();
      rafraichir();
      expect(enregistrer).toHaveBeenCalledWith('tdb-3', jasmine.objectContaining({ statut: 'Inactif', profils: ['manager'] }));
      expect(bouton().getAttribute('aria-label')).toBe('Enregistré ✓');
      expect(bouton().textContent?.trim()).toBe('Enregistré');

      (ligne('Pyramide des âges').querySelector('[aria-label="Ajouter Pyramide des âges"]') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(bouton().textContent?.trim()).toBe('Enregistrer');
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

    it('« Prévisualiser » : plein écran, KPI en haut puis graphes sur 2 colonnes, données simulées ; Échap ferme', () => {
      (el().querySelector('[data-testid="previsualiser"]') as HTMLButtonElement).click();
      fixture.detectChanges();
      const calque = apercu()!;
      expect(calque.textContent).toContain('Dashboard Managers');
      expect(calque.textContent).toContain('Prévisualisation · Managers – périmètre hiérarchique · 4 KPIs');
      expect(calque.textContent).toContain('Données simulées');
      const grilles = calque.querySelectorAll('[data-testid="apercu"] soc-card-grid');
      expect(grilles.length).toBe(2);
      expect(grilles[0].querySelectorAll('app-widget-carte').length).toBe(1);
      expect(grilles[1].querySelectorAll('app-widget-carte').length).toBe(3);
      calque.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();
      expect(page['apercu']()).toBeFalse();
      expect(document.body.querySelector('[data-testid="apercu"]')).toBeNull();
    });
  });

  it('composition vide : invite à cliquer dans la bibliothèque ; prévisualisation vide', fakeAsync(() => {
    ouvrir('tdb-3');
    page['brouillon'].update((t: any) => ({ ...t, widgets: [] }));
    fixture.detectChanges();
    const vide = el().querySelector('[data-testid="composition-vide"]')!;
    expect(vide.tagName).toBe('SOC-LABS-DROP-ZONE');
    expect(vide.textContent).toContain('Cliquez sur un graphe dans la bibliothèque →');
    expect(el().querySelector('[data-testid="emplacement"]')).toBeNull();
    page['apercu'].set(true);
    fixture.detectChanges();
    expect(document.body.querySelector('[data-testid="apercu"]')?.textContent).toContain('Aucun KPI ajouté — retournez à la bibliothèque pour en ajouter.');
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
