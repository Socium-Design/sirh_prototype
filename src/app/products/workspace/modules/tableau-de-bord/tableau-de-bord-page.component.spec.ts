import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { SessionService } from '../../../../core/session/session.service';
import { TableauDeBordPageComponent } from './tableau-de-bord-page.component';

describe('TableauDeBordPageComponent (consultation)', () => {
  let fixture: ComponentFixture<TableauDeBordPageComponent>;
  let session: SessionService;
  let query: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  const el = () => fixture.nativeElement as HTMLElement;
  const widgets = () => [...el().querySelectorAll('[data-testid="widget"]')] as HTMLElement[];
  const sections = () => [...el().querySelectorAll('[data-testid="section"] .section__titre')].map((s) => s.textContent?.trim());
  const kpi = () => el().querySelector('[data-testid="widget"] [data-testid="kpi"]')?.textContent?.trim();
  const masquer = (titre: string) => (el().querySelector(`button[aria-label="Masquer le widget ${titre}"]`) as HTMLButtonElement).click();
  const panneauVisible = () => [...document.body.querySelectorAll<HTMLElement>('[role="dialog"]')].find((p) => p.style.visibility === 'visible')!;
  const menu = (titre: string) => {
    (el().querySelector(`button[aria-label="Actions du widget ${titre}"]`) as HTMLButtonElement).click();
    fixture.detectChanges();
    return [...panneauVisible().querySelectorAll('button[socMenuItem]')] as HTMLButtonElement[];
  };

  const ouvrir = (role: 'admin-rh' | 'manager' = 'admin-rh', tableau?: string) => {
    query = new BehaviorSubject(convertToParamMap(tableau ? { tableau } : {}));
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: query.value }, queryParamMap: query } }],
    });
    session = TestBed.inject(SessionService);
    session.role.set(role);
    fixture = TestBed.createComponent(TableauDeBordPageComponent);
    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();
  };

  afterEach(() => fixture.destroy());

  it('affiche le premier tableau accessible, segmenté par section, un vrai graphique par widget', fakeAsync(() => {
    ouvrir();
    expect(el().textContent).toContain('Dashboard RH Global');
    expect(sections()).toEqual(['Effectifs', 'Mouvements du personnel']);
    expect(widgets().length).toBe(6);
    expect(el().querySelectorAll('canvas').length).toBe(5);
  }));

  it('calcule les widgets sur la filiale active, ou toutes en vue consolidée', fakeAsync(() => {
    ouvrir();
    expect(el().querySelector('[data-testid="perimetre"]')?.textContent).toContain('Sénégal');
    expect(kpi()).toBe('11');
    session.enterprise.set('fr');
    fixture.detectChanges();
    expect(kpi()).toBe('4');
    session.enterprise.set('groupe');
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="perimetre"]')?.textContent).toContain('Vue consolidée');
    expect(kpi()).toBe('20');
  }));

  it('masque un widget (œil) et le liste plus bas avec ses filtres, pour le réafficher', fakeAsync(() => {
    ouvrir();
    masquer('Turnover mensuel');
    fixture.detectChanges();
    expect(widgets().length).toBe(5);
    const masque = el().querySelector('[data-testid="widget-masque"]')!;
    expect(masque.textContent).toContain('Turnover mensuel');
    expect(masque.textContent).toContain('Site : Dakar');
    (masque.querySelector('button[aria-label="Afficher le widget Turnover mensuel"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(widgets().length).toBe(6);
    expect(el().querySelector('[data-testid="masques"]')).toBeNull();
  }));

  it('permet d’aller jusqu’à « 0 KPI », puis de tout réafficher', fakeAsync(() => {
    ouvrir();
    for (const titre of ['Effectif actif', 'Effectif par site', 'Effectif par département', 'Actifs et inactifs', "Évolution de l'effectif", 'Turnover mensuel']) {
      masquer(titre);
      fixture.detectChanges();
    }
    expect(widgets().length).toBe(0);
    expect(sections()).toEqual([]);
    const zero = el().querySelector('[data-testid="zero-kpi"]')!;
    expect(zero.textContent).toContain('Vous avez masqué tous les widgets');
    ([...zero.querySelectorAll('button')].find((b) => b.textContent?.includes('Tout réafficher')) as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(widgets().length).toBe(6);
  }));

  it('kebab admin RH : « Modifier » mène à la composition dans la Configuration ; « Exporter en PDF » est simulé', fakeAsync(() => {
    ouvrir();
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    const items = menu('Effectif actif');
    expect(items.map((b) => b.textContent?.trim())).toEqual(['Modifier', 'Exporter en PDF']);
    items[1].click();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="message"]')?.textContent).toContain('Export PDF du widget « Effectif actif » lancé (simulation)');
    menu('Effectif actif')[0].click();
    expect(navigate).toHaveBeenCalledWith(['/workspace/configuration/tableaux-de-bord', 'tdb-1'], { queryParams: { mode: 'edition' } });
  }));

  it('vue manager : seulement les tableaux de ses populations, sans « Modifier »', fakeAsync(() => {
    ouvrir('manager');
    expect(el().textContent).toContain('Dashboard effectifs internationaux');
    expect(el().textContent).not.toContain('Dashboard RH Global');
    expect(menu('Effectif par filiale').map((b) => b.textContent?.trim())).toEqual(['Exporter en PDF']);
  }));

  it('suit le tableau demandé dans l’URL, sinon le premier accessible', fakeAsync(() => {
    ouvrir('admin-rh', 'tdb-3');
    expect(el().textContent).toContain('Dashboard effectifs internationaux');
    query.next(convertToParamMap({ tableau: 'tdb-4' })); // inactif : pas accessible
    fixture.detectChanges();
    expect(el().textContent).toContain('Dashboard RH Global');
  }));

  it('aucun tableau accessible : message explicite', fakeAsync(() => {
    ouvrir('manager');
    session.user.set({ ...session.user(), email: 'inconnu@socium.link' });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="aucun-tableau"]')?.textContent).toContain('Aucun tableau de bord actif n\'est accessible en tant que Manager');
  }));
});
