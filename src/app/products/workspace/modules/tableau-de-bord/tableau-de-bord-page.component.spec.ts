import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { SessionService, type RoleDemo } from '../../../../core/session/session.service';
import { TableauxDeBordService } from './services/tableaux-de-bord.service';
import { TableauDeBordPageComponent } from './tableau-de-bord-page.component';

describe('TableauDeBordPageComponent (consultation)', () => {
  let fixture: ComponentFixture<TableauDeBordPageComponent>;
  let session: SessionService;
  const el = () => fixture.nativeElement as HTMLElement;
  const widgets = () => [...el().querySelectorAll('[data-testid="widget"]')] as HTMLElement[];
  const titres = () => widgets().map((w) => w.querySelector('soc-card p')?.textContent?.trim());
  const sections = () => [...el().querySelectorAll('[data-testid="section"] .section__titre')].map((s) => s.textContent?.trim());
  const carte = (titre: string) => widgets().find((w) => w.querySelector('soc-card p')?.textContent?.trim() === titre)!;
  const panneauVisible = () => [...document.body.querySelectorAll<HTMLElement>('[role="dialog"]')].find((p) => p.style.visibility === 'visible')!;
  const detecter = () => {
    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();
  };

  const ouvrir = (role: RoleDemo = 'admin-rh', tableau?: string, avant?: () => void) => {
    const query = new BehaviorSubject(convertToParamMap(tableau ? { tableau } : {}));
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: query.value }, queryParamMap: query } }],
    });
    session = TestBed.inject(SessionService);
    session.role.set(role);
    avant?.();
    fixture = TestBed.createComponent(TableauDeBordPageComponent);
    detecter();
  };

  afterEach(() => fixture.destroy());

  it('« Mon tableau de bord » + tag « RH », périmètre, population et date des données', fakeAsync(() => {
    ouvrir();
    expect(el().textContent).toContain('Mon tableau de bord');
    expect(el().querySelector('[data-testid="role"]')?.textContent?.trim()).toBe('RH');
    expect(el().textContent).toContain('Périmètre : Socium Enterprises · Population : Équipe Sénégal · Données au 09/10/2026');
    // Plus de sélecteur de tableau, de filiale ni d'œil pour masquer.
    expect(el().textContent).not.toContain('Vue consolidée');
    expect(el().querySelector('[aria-label^="Masquer"]')).toBeNull();
  }));

  it('sections Indicateurs clés / Effectifs et mouvements / Rémunération et absentéisme ; KPI avec tendance', fakeAsync(() => {
    ouvrir();
    expect(sections()).toEqual(['Indicateurs clés', 'Effectifs et mouvements', 'Rémunération et absentéisme']);
    expect(widgets().length).toBe(9);
    const effectif = carte('Effectif total');
    expect(effectif.querySelector('[data-testid="kpi"]')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('11 collaborateurs');
    expect(effectif.querySelector('[data-testid="tendance"]')?.textContent?.trim()).toBe('+13 ce mois');
  }));

  it('le filtre « Rôle » change le tableau, donc les sections affichées', fakeAsync(() => {
    ouvrir();
    expect(el().querySelector('soc-select')?.textContent).toContain('Administrateur RH');
    session.role.set('manager');
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="role"]')?.textContent?.trim()).toBe('Manager');
    expect(titres()).toEqual(['Effectif total', 'Turnover par département', "Taux d'absentéisme", 'Absences par motif']);
    expect(el().textContent).toContain('Population : Managers – périmètre hiérarchique');
    session.role.set('direction-generale');
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="role"]')?.textContent?.trim()).toBe('DG');
    expect(titres()).toContain('Masse salariale mensuelle');
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

  it('« Visualiser » (?tableau=) : ce tableau-là, même inactif, sans filtre « Rôle »', fakeAsync(() => {
    ouvrir('admin-rh', 'tdb-5');
    expect(el().textContent).toContain('Dashboard effectifs internationaux');
    expect(el().querySelector('soc-select')).toBeNull();
    expect(el().textContent).toContain('Population : Filiales hors Sénégal');
  }));

  it('état vide : « Votre tableau de bord est vide » + « Configurer le tableau de bord »', fakeAsync(() => {
    ouvrir('manager', undefined, () => {
      const service = TestBed.inject(TableauxDeBordService);
      service.enregistrerComposition('tdb-3', { libelle: 'Dashboard Managers', description: '', populationId: 'pop-6', widgets: [], sections: [], statut: 'Actif', profils: ['manager'] }).subscribe();
    });
    expect(el().querySelector('[data-testid="vide"]')?.textContent).toContain('Votre tableau de bord est vide');
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    ([...el().querySelectorAll('[data-testid="vide"] button')].find((b) => b.textContent?.includes('Configurer le tableau de bord')) as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith(['/workspace/configuration/tableaux-de-bord', 'tdb-3'], { queryParams: { mode: 'edition' } });
  }));
});
