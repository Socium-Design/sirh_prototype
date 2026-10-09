import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TableauxDeBordService } from '../../tableau-de-bord/services/tableaux-de-bord.service';
import { TableauDeBordCompositionPageComponent } from './tableau-de-bord-composition-page.component';

type Page = TableauDeBordCompositionPageComponent & Record<string, any>;

describe('TableauDeBordCompositionPageComponent (Bibliothèque, édition)', () => {
  let fixture: ComponentFixture<TableauDeBordCompositionPageComponent>;
  let page: Page;
  const el = () => fixture.nativeElement as HTMLElement;
  const widgets = () => [...el().querySelectorAll('[data-testid="widget"]')] as HTMLElement[];
  const sectionsAffichees = () => [...el().querySelectorAll('[data-testid="section"] .section__titre')].map((s) => s.textContent?.trim());
  const indicateur = (titre: string) =>
    [...el().querySelectorAll('[data-testid="indicateur"], [data-testid="indicateur-indisponible"]')].find((c) => c.textContent?.includes(titre)) as HTMLElement;
  const rafraichir = () => {
    tick(300);
    fixture.detectChanges();
  };
  const panneauVisible = () => [...document.body.querySelectorAll<HTMLElement>('[role="dialog"]')].find((p) => p.style.visibility === 'visible')!;
  const menu = (titre: string, item: string) => {
    (widgets().find((w) => w.textContent?.includes(titre))!.querySelector('button[aria-label^="Actions du widget"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    return [...panneauVisible().querySelectorAll('button[socMenuItem]')].find((b) => b.textContent?.includes(item)) as HTMLButtonElement;
  };

  const ouvrir = (id: string, mode: 'edition' | 'lecture' = 'edition') => {
    const query = convertToParamMap(mode === 'edition' ? { mode } : {});
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id }), queryParamMap: query }, queryParamMap: of(query) } }],
    });
    fixture = TestBed.createComponent(TableauDeBordCompositionPageComponent);
    page = fixture.componentInstance as Page;
    fixture.detectChanges();
    rafraichir();
  };

  afterEach(() => fixture.destroy());

  it('affiche le tableau par section (vides comprises, comme cibles), la répartition et un vrai graphique par widget', fakeAsync(() => {
    ouvrir('tdb-1');
    expect(el().querySelector('h1')?.textContent).toContain('Dashboard RH Global');
    expect(sectionsAffichees()).toEqual(['Effectifs', 'Mouvements du personnel', 'Performance', 'Temps & absences', 'Paie', 'Formation']);
    const repartition = [...el().querySelectorAll('[data-testid="repartition"] soc-tag')].map((t) => t.textContent?.trim());
    expect(repartition).toEqual(['Effectifs · 4', 'Mouvements du personnel · 2']);
    expect(widgets().length).toBe(6);
    expect(el().querySelectorAll('app-widget-graphique').length).toBe(6);
  }));

  it('Bibliothèque : sections non vides seulement, indicateur non souscrit grisé et non ajoutable', fakeAsync(() => {
    ouvrir('tdb-4');
    const sections = [...el().querySelectorAll('[data-testid="section-catalogue"]')].map((s) => s.getAttribute('ng-reflect-label') ?? s.textContent?.trim().split('\n')[0]);
    expect(sections.length).toBe(5);
    const masse = indicateur('Masse salariale');
    expect(masse.getAttribute('data-testid')).toBe('indicateur-indisponible');
    expect(masse.textContent).toContain('Non souscrit');
    expect(document.body.textContent).toContain('Indicateur du produit Payroll, non souscrit');
    page['ajouter']({ ...page['catalogue']().flatMap((s: any) => s.indicateurs).find((i: any) => i.id === 'ind-masse-salariale') });
    rafraichir();
    expect(widgets().length).toBe(2);
  }));

  it('ajoute un indicateur au clic, dans la section de son indicateur', fakeAsync(() => {
    ouvrir('tdb-4');
    (indicateur('Demandes de congés').querySelector('soc-card > div') as HTMLElement).click();
    rafraichir();
    expect(widgets().length).toBe(3);
    expect(el().querySelector('[data-testid="message"]')?.textContent).toContain('« Demandes de congés » ajouté à la section Temps & absences');
    expect(indicateur('Demandes de congés').textContent).toContain('Ajouté');
  }));

  it('ajoute un indicateur déposé dans une section (glisser-déposer)', fakeAsync(() => {
    ouvrir('tdb-4');
    // Événement CDK minimal : seuls les conteneurs (source ≠ cible) et la donnée de l'élément glissé comptent.
    const depot = { previousContainer: { data: undefined }, container: { data: 'formation' }, item: { data: 'ind-turnover' } };
    page['deposer'](depot as unknown as CdkDragDrop<string, unknown, string>);
    rafraichir();
    const formation = [...el().querySelectorAll('[data-testid="section"]')].find((s) => s.textContent?.includes('Formation'))!;
    expect(formation.textContent).toContain('Taux de turnover');
  }));

  it('modifie un widget dans le panneau latéral : titre, filtres rattachés à la carte', fakeAsync(() => {
    ouvrir('tdb-4');
    menu('Entretiens annuels', 'Modifier').click();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="edition-widget"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="catalogue"]')).toBeNull();
    page['formWidget'].patchValue({ titre: 'Entretiens DSI', filtres: ['site:Dakar'] });
    ([...el().querySelectorAll('[data-testid="edition-widget"] button')].find((b) => b.textContent?.trim() === 'Enregistrer') as HTMLButtonElement).click();
    rafraichir();
    const carte = widgets().find((w) => w.textContent?.includes('Entretiens DSI'))!;
    expect(carte.querySelector('[data-testid="filtres"]')?.textContent?.trim()).toBe('Site : Dakar');
    expect(el().querySelector('[data-testid="catalogue"]')).not.toBeNull();
  }));

  it('« Réinitialiser » rend le titre du catalogue, et n’est disponible que pour un widget personnalisé', fakeAsync(() => {
    ouvrir('tdb-1');
    expect(menu('Effectif actif', 'Réinitialiser').disabled).toBeTrue();
    menu('Turnover mensuel', 'Réinitialiser').click();
    rafraichir();
    expect(widgets().some((w) => w.textContent?.includes('Taux de turnover'))).toBeTrue();
    expect(widgets().some((w) => w.textContent?.includes('Turnover mensuel'))).toBeFalse();
  }));

  it('retire un widget', fakeAsync(() => {
    ouvrir('tdb-4');
    menu('Objectifs par état', 'Retirer').click();
    rafraichir();
    expect(widgets().length).toBe(1);
  }));

  it('renomme une section', fakeAsync(() => {
    ouvrir('tdb-4');
    (el().querySelector('button[aria-label="Renommer la section Performance"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    page['nomSection'].setValue('Perf DSI');
    ([...document.body.querySelectorAll('[aria-modal="true"] button')].find((b) => b.textContent?.trim() === 'Renommer') as HTMLButtonElement).click();
    rafraichir();
    expect(sectionsAffichees()).toContain('Perf DSI');
  }));

  it('affiche le détail d’un indicateur du catalogue', fakeAsync(() => {
    ouvrir('tdb-4');
    (indicateur('Taux de turnover').querySelector('soc-card button') as HTMLButtonElement).click();
    fixture.detectChanges();
    const detail = document.body.querySelector('[data-testid="detail-indicateur"]')!;
    expect(detail.textContent).toContain('Départs du mois / effectif moyen du mois');
    expect(detail.textContent).toContain('Site, Filiale');
  }));

  it('« Visualiser » : aperçu sans Bibliothèque ni menus, puis « Activer » devient possible', fakeAsync(() => {
    ouvrir('tdb-4');
    const activer = () => el().querySelector('[data-testid="activer"]') as HTMLButtonElement;
    expect(activer().disabled).toBeTrue();
    (el().querySelector('[data-testid="visualiser"]') as HTMLButtonElement).click();
    rafraichir();
    expect(el().querySelector('[data-testid="catalogue"]')).toBeNull();
    expect(el().querySelectorAll('button[aria-label^="Actions du widget"]').length).toBe(0);
    expect(sectionsAffichees()).toEqual(['Performance']);
    expect(el().textContent).toContain('tel que le verront les employés de « DSI actifs hors Paris »');
    expect(activer().disabled).toBeFalse();
    activer().click();
    rafraichir();
    expect(el().querySelector('[data-testid="activer"]')).toBeNull();
    let statut = '';
    TestBed.inject(TableauxDeBordService).getById('tdb-4').subscribe((t) => (statut = t!.statut));
    tick(300);
    expect(statut).toBe('Actif');
  }));

  describe('« Voir détails » (lecture seule)', () => {
    it('affiche les informations générales à gauche et les widgets sans Bibliothèque, menus ni sections vides', fakeAsync(() => {
      ouvrir('tdb-3', 'lecture');
      const infos = el().querySelector('[data-testid="infos"]')!;
      expect(infos.textContent).toContain('Dashboard effectifs internationaux');
      expect(infos.textContent).toContain('Filiales hors Sénégal');
      expect(infos.textContent).toContain('Filiale est France');
      expect(infos.textContent).toContain('11 employé(s)');
      expect(el().querySelector('[data-testid="catalogue"]')).toBeNull();
      expect(el().querySelectorAll('button[aria-label^="Actions du widget"]').length).toBe(0);
      expect(el().querySelector('button[aria-label^="Renommer"]')).toBeNull();
      expect(sectionsAffichees()).toEqual(['Effectifs par pays', 'Mouvements du personnel']);
      expect(el().querySelector('[data-testid="bibliotheque"]')).toBeNull();
    }));

    it('« Modifier » (à côté de « Visualiser ») passe en mode édition via l’URL', fakeAsync(() => {
      ouvrir('tdb-3', 'lecture');
      const navigate = spyOn(TestBed.inject(Router), 'navigate');
      const modifier = el().querySelector('[data-testid="modifier"]') as HTMLButtonElement;
      expect(modifier.closest('soc-tooltip')?.previousElementSibling?.querySelector('[data-testid="visualiser"]')).not.toBeNull();
      modifier.click();
      expect(navigate).toHaveBeenCalledWith([], jasmine.objectContaining({ queryParams: { mode: 'edition' } }));
    }));

    it('« Terminer » revient en lecture seule', fakeAsync(() => {
      ouvrir('tdb-3');
      const navigate = spyOn(TestBed.inject(Router), 'navigate');
      (el().querySelector('[data-testid="terminer"]') as HTMLButtonElement).click();
      expect(navigate).toHaveBeenCalledWith([], jasmine.objectContaining({ queryParams: { mode: null } }));
    }));
  });
});
