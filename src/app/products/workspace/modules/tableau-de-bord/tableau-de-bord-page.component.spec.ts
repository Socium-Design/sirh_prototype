import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { TableauxDeBordService } from './services/tableaux-de-bord.service';
import { TableauDeBordPageComponent } from './tableau-de-bord-page.component';

type Page = Record<string, any>;

describe('TableauDeBordPageComponent (consultation)', () => {
  let fixture: ComponentFixture<TableauDeBordPageComponent>;
  let page: Page;
  let query: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  const el = () => fixture.nativeElement as HTMLElement;
  const widgets = () => [...el().querySelectorAll('[data-testid="widget"]')] as HTMLElement[];
  const titres = () => widgets().map((w) => w.querySelector('soc-card p')?.textContent?.trim());
  const sections = () => [...el().querySelectorAll('[data-testid="section"] .section__titre')].map((s) => s.textContent?.trim());
  const carte = (titre: string) => widgets().find((w) => w.querySelector('soc-card p')?.textContent?.trim() === titre)!;
  const kpi = (titre: string) => carte(titre).querySelector('[data-testid="kpi"]')?.textContent?.replace(/\s+/g, ' ').trim();
  const panneauVisible = () => [...document.body.querySelectorAll<HTMLElement>('[role="dialog"]')].find((p) => p.style.visibility === 'visible')!;
  const detecter = () => {
    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();
  };

  const ouvrir = (tableau?: string, avant?: () => void) => {
    query = new BehaviorSubject(convertToParamMap(tableau ? { tableau } : {}));
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: query.value }, queryParamMap: query } }],
    });
    avant?.();
    fixture = TestBed.createComponent(TableauDeBordPageComponent);
    page = fixture.componentInstance as unknown as Page;
    detecter();
  };

  afterEach(() => fixture.destroy());

  it('« Mon tableau de bord » : population adressée, périmètre de l’utilisateur, sans filtre « Rôle »', fakeAsync(() => {
    ouvrir();
    expect(el().textContent).toContain('Mon tableau de bord');
    expect(el().textContent).toContain('Population adressée : Équipe Sénégal · Données de votre périmètre (Socium Enterprises) au 09/10/2026');
    expect(el().textContent).not.toContain('Rôle');
    expect(el().querySelector('[data-testid="role"]')).toBeNull();
  }));

  it('menu déroulant des tableaux de bord accessibles ; le choix change le tableau (via l’URL)', fakeAsync(() => {
    ouvrir();
    const menu = el().querySelector('[data-testid="tableaux"]')!;
    expect(menu.textContent).toContain('Tableau de bord');
    expect(menu.textContent).toContain('Admin RH Global');
    (menu.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect([...panneauVisible().querySelectorAll('button')].map((b) => b.textContent?.trim())).toEqual(['Admin RH Global', 'Mon équipe', 'Direction générale']);

    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    page['choisirTableau']('tdb-3');
    expect(navigate).toHaveBeenCalledWith([], jasmine.objectContaining({ queryParams: { tableau: 'tdb-3' } }));
    query.next(convertToParamMap({ tableau: 'tdb-3' }));
    fixture.detectChanges();
    expect(el().textContent).toContain('Mon tableau de bord');
    expect(el().querySelector('[data-testid="tableaux"]')?.textContent).toContain('Mon équipe');
    expect(titres()).toEqual(['Effectif total', 'Turnover par département', "Taux d'absentéisme", 'Absences par motif']);
    expect(el().textContent).toContain('Population adressée : Managers – périmètre hiérarchique');
  }));

  it('sections Indicateurs clés / Effectifs et mouvements / Rémunération et absentéisme / Workflows personnalisés ; KPI avec tendance', fakeAsync(() => {
    ouvrir();
    expect(sections()).toEqual(['Indicateurs clés', 'Effectifs et mouvements', 'Rémunération et absentéisme', 'Workflows personnalisés']);
    expect(widgets().length).toBe(10);
    expect(kpi('Effectif total')).toBe('18 collaborateurs');
    expect(carte('Effectif total').querySelector('[data-testid="tendance"]')?.textContent?.trim()).toBe('+13 ce mois');
    expect(carte('Demandes de mission').textContent).toContain('Demandes « Demande de mission », par mois et par statut.');
  }));

  it('filtres globaux : sortis et comptes désactivés exclus par défaut ; les cocher met à jour les cartes ; « Réinitialiser »', fakeAsync(() => {
    ouvrir();
    const barre = el().querySelector('[data-testid="filtres-globaux"]')!;
    expect([...barre.querySelectorAll('soc-multi-select label')].map((l) => l.textContent?.trim())).toEqual([
      "Statut de l'employé",
      'Statut du compte',
      'Compte configuré',
      'Statut paie',
    ]);
    expect(barre.querySelector('[data-testid="filtre-statutEmploye"]')?.textContent).toContain('Actif');
    expect(barre.querySelector('[data-testid="filtre-statutEmploye"]')?.textContent).not.toContain('Sorti');
    expect(el().querySelector('[data-testid="reinitialiser"]')).toBeNull();

    page['changerFiltre']('statutEmploye', ['Actif', 'Sorti']);
    page['changerFiltre']('statutCompte', ['Actif', 'Désactivé']);
    fixture.detectChanges();
    expect(kpi('Effectif total')).toBe('23 collaborateurs');
    page['changerFiltre']('compteConfigure', ['Non']);
    fixture.detectChanges();
    expect(kpi('Effectif total')).toBe('5 collaborateurs');

    (el().querySelector('[data-testid="reinitialiser"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(kpi('Effectif total')).toBe('18 collaborateurs');
    expect(el().querySelector('[data-testid="reinitialiser"]')).toBeNull();
  }));

  it('filtre de carte contraire à un filtre global : le global l’emporte et la carte le signale', fakeAsync(() => {
    ouvrir();
    expect(carte('Répartition H/F').querySelector('[data-testid="filtre-ignore"]')?.textContent).toContain(
      "Filtre Statut : Inactif non appliqué : les filtres globaux l'emportent.",
    );
    expect(carte('Effectif total').querySelector('[data-testid="filtre-ignore"]')).toBeNull();
    page['changerFiltre']('statutEmploye', ['Actif', 'Sorti']);
    fixture.detectChanges();
    expect(carte('Répartition H/F').querySelector('[data-testid="filtre-ignore"]')).toBeNull();
  }));

  it('description tronquée à 96 caractères ; avertissement sur les données classifiées sans historisation', fakeAsync(() => {
    ouvrir();
    const sousTitre = carte('Pyramide des âges').querySelectorAll('soc-card p')[1].textContent!.trim();
    expect(sousTitre.length).toBe(97);
    expect(sousTitre.endsWith('…')).toBeTrue();
    expect(carte('Répartition H/F').querySelector('[data-testid="classifie"]')?.textContent).toContain(
      'Données classifiées sans historisation — affichage temps réel uniquement.',
    );
    expect(carte('Pyramide des âges').querySelector('[data-testid="classifie"]')).toBeNull();
  }));

  it('menu d’un graphe : « Modifier » seulement, vers la composition dans la Configuration', fakeAsync(() => {
    ouvrir();
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    (carte('Effectif total').querySelector('button[aria-label="Actions du graphe Effectif total"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const items = [...panneauVisible().querySelectorAll('button[socMenuItem]')] as HTMLButtonElement[];
    expect(items.map((b) => b.textContent?.trim())).toEqual(['Modifier']);
    items[0].click();
    expect(navigate).toHaveBeenCalledWith(['/workspace/configuration/tableaux-de-bord', 'tdb-1'], { queryParams: { mode: 'edition' } });
  }));

  it('« Visualiser » (?tableau=) d’un tableau non accessible : ce tableau-là, même inactif, sans menu déroulant', fakeAsync(() => {
    ouvrir('tdb-5');
    expect(el().textContent).toContain('Dashboard effectifs internationaux');
    expect(el().querySelector('[data-testid="tableaux"]')).toBeNull();
    expect(el().textContent).toContain('Population adressée : Filiales hors Sénégal');
  }));

  it('état vide : « Votre tableau de bord est vide » + « Configurer le tableau de bord »', fakeAsync(() => {
    ouvrir('tdb-3', () => {
      const service = TestBed.inject(TableauxDeBordService);
      service
        .enregistrerComposition('tdb-3', { libelle: 'Mon équipe', description: '', produit: 'workspace', populationId: 'pop-6', widgets: [], sections: [], statut: 'Actif' })
        .subscribe();
    });
    expect(el().querySelector('[data-testid="vide"]')?.textContent).toContain('Votre tableau de bord est vide');
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    ([...el().querySelectorAll('[data-testid="vide"] button')].find((b) => b.textContent?.includes('Configurer le tableau de bord')) as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith(['/workspace/configuration/tableaux-de-bord', 'tdb-3'], { queryParams: { mode: 'edition' } });
  }));
});
