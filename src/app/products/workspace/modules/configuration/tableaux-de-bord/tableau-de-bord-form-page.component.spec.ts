import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { SessionService } from '../../../../../core/session/session.service';
import { TableauxDeBordService } from '../../tableau-de-bord/services/tableaux-de-bord.service';
import { TableauDeBordFormPageComponent } from './tableau-de-bord-form-page.component';

/** Accès aux membres protégés (les listes du kit s'ouvrent dans un popover : on pilote les contrôles directement). */
type Page = TableauDeBordFormPageComponent & Record<string, any>;

describe('TableauDeBordFormPageComponent', () => {
  let fixture: ComponentFixture<TableauDeBordFormPageComponent>;
  let page: Page;
  let navigateByUrl: jasmine.Spy;
  let navigate: jasmine.Spy;
  const el = () => fixture.nativeElement as HTMLElement;
  const bouton = (texte: string) => [...el().querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;
  const radio = (id: string) => el().querySelector(`#${id}`) as HTMLButtonElement | null;
  const cliquer = (texte: string) => {
    bouton(texte).click();
    fixture.detectChanges();
  };
  const remplir = (valeurs: Record<string, string>) => {
    page['form'].patchValue(valeurs);
    fixture.detectChanges();
  };

  const creer = (id?: string, role: 'admin-rh' | 'manager' = 'admin-rh') => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } }],
    });
    TestBed.inject(SessionService).role.set(role);
    const router = TestBed.inject(Router);
    navigateByUrl = spyOn(router, 'navigateByUrl');
    navigate = spyOn(router, 'navigate');
    fixture = TestBed.createComponent(TableauDeBordFormPageComponent);
    page = fixture.componentInstance as Page;
    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();
  };

  afterEach(() => fixture.destroy());

  describe('création', () => {
    beforeEach(fakeAsync(() => creer()));

    it('propose « Inactif » par défaut, « Actif » indisponible, et pas d’« Archivé »', () => {
      expect(radio('statut-Inactif')?.getAttribute('aria-checked')).toBe('true');
      expect(radio('statut-Actif')?.disabled).toBeTrue();
      expect(radio('statut-Archivé')).toBeNull();
      expect(el().textContent).toContain('pourra être activé après une prévisualisation');
    });

    it('exige un libellé unique et une population', () => {
      cliquer('Suivant');
      expect(el().textContent).toContain('Le libellé est obligatoire.');
      expect(el().textContent).toContain('Choisissez la population');
      remplir({ libelle: ' dashboard rh global ' });
      cliquer('Suivant');
      expect(el().textContent).toContain('Un tableau de bord porte déjà ce libellé.');
      expect(el().querySelector('[data-testid="apercu-depart"]')).toBeNull();
    });

    it('affiche les critères de la population choisie et le nombre d’employés couverts', () => {
      remplir({ populationId: 'pop-6' });
      const criteres = el().querySelector('[data-testid="criteres"]')!;
      expect(criteres.textContent).toContain('Toutes les conditions (ET)');
      expect(criteres.textContent).toContain('Site est Dakar, Thiès');
      expect(criteres.querySelector('[data-testid="nb-couverts"]')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('7 employés couverts');
      expect(bouton('Modifier les critères')).toBeDefined();
    });

    it('propose la V0 par défaut à l’étape 2, puis crée un tableau inactif', fakeAsync(() => {
      remplir({ libelle: 'Mon tableau', populationId: 'pop-1' });
      cliquer('Suivant');
      expect(radio('depart-v0')?.getAttribute('aria-checked')).toBe('true');
      expect(el().querySelector('[data-testid="apercu-depart"]')?.textContent).toContain('5 widgets courants : Effectif actif');
      cliquer('Créer le tableau de bord');
      tick(300);
      let cree: any;
      TestBed.inject(TableauxDeBordService).getAll().subscribe((t) => (cree = t.find((x) => x.libelle === 'Mon tableau')));
      tick(300);
      expect(cree.statut).toBe('Inactif');
      expect(cree.widgets.length).toBe(5);
      expect(navigate).toHaveBeenCalledWith(['/workspace/configuration/tableaux-de-bord', cree.id], { queryParams: { mode: 'edition' } });
    }));

    it('exige le tableau source pour une copie', () => {
      remplir({ libelle: 'Copie', populationId: 'pop-1' });
      cliquer('Suivant');
      remplir({ depart: 'copie' });
      cliquer('Créer le tableau de bord');
      expect(el().textContent).toContain('Choisissez le tableau de bord à copier.');
      remplir({ sourceId: 'tdb-3' });
      expect(el().querySelector('[data-testid="apercu-depart"]')?.textContent).toContain('3 widget(s) copié(s) depuis « Dashboard effectifs internationaux »');
    });

    it('garde la saisie quand on part modifier les critères de la population, puis la restaure', fakeAsync(() => {
      remplir({ libelle: 'Brouillon', populationId: 'pop-6' });
      cliquer('Modifier les critères');
      expect(navigate).toHaveBeenCalledWith(['/workspace/configuration/populations', 'pop-6', 'modifier'], jasmine.objectContaining({ queryParams: jasmine.any(Object) }));
      fixture.destroy();
      fixture = TestBed.createComponent(TableauDeBordFormPageComponent);
      page = fixture.componentInstance as Page;
      fixture.detectChanges();
      tick(300);
      expect(page['form'].getRawValue()).toEqual(jasmine.objectContaining({ libelle: 'Brouillon', populationId: 'pop-6' }));
      expect(TestBed.inject(TableauxDeBordService).brouillon).toBeNull();
    }));
  });

  it('manager : critères en lecture seule', fakeAsync(() => {
    creer(undefined, 'manager');
    remplir({ populationId: 'pop-6' });
    expect(bouton('Modifier les critères')).toBeUndefined();
    expect(el().textContent).toContain('Seul un admin RH peut modifier les critères');
  }));

  describe('modification', () => {
    it('pré-remplit, propose « Archivé », garde « Actif » indisponible sans prévisualisation', fakeAsync(() => {
      creer('tdb-4');
      expect((el().querySelector('soc-input-text input') as HTMLInputElement).value).toBe('Performance DSI');
      expect(radio('statut-Archivé')).not.toBeNull();
      expect(radio('statut-Actif')?.disabled).toBeTrue();
      expect(el().querySelector('soc-stepper')).toBeNull();
    }));

    it('autorise « Actif » pour un tableau déjà prévisualisé et enregistre', fakeAsync(() => {
      creer('tdb-2');
      expect(radio('statut-Actif')?.disabled).toBeFalse();
      radio('statut-Actif')!.click();
      fixture.detectChanges();
      cliquer('Enregistrer');
      tick(300);
      let statut = '';
      TestBed.inject(TableauxDeBordService).getById('tdb-2').subscribe((t) => (statut = t!.statut));
      tick(300);
      expect(statut).toBe('Actif');
    }));
  });
});
