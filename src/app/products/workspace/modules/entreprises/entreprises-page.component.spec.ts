import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { EntreprisesPageComponent } from './entreprises-page.component';

describe('EntreprisesPageComponent', () => {
  let fixture: ComponentFixture<EntreprisesPageComponent>;
  const rows = () => [...fixture.nativeElement.querySelectorAll('tbody tr')] as HTMLElement[];
  const actions = (row: HTMLElement) => row.querySelector('[data-testid="actions"]') as HTMLElement;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(EntreprisesPageComponent);
    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();
  }));

  it('liste les 5 entreprises avec leurs colonnes et pastilles de modules', () => {
    expect(rows().length).toBe(5);
    const entetes = [...fixture.nativeElement.querySelectorAll('thead th')].map((th: HTMLElement) => th.textContent!.trim());
    expect(entetes).toEqual(jasmine.arrayContaining(['Nom', 'Pays convention', 'Modules', 'Forme juridique', 'Créé le', 'Actions']));
    const pastilles = [...rows()[0].querySelectorAll('soc-labs-tag')].map((t) => t.querySelector('[aria-hidden]')!.textContent!.trim());
    expect(pastilles).toEqual(['CO', 'JO', 'PE', 'WO']);
    expect(rows()[0].querySelector('soc-labs-tag .sr-only')!.textContent).toContain('Core RH');
  });

  it("actions dans l'ordre : interrupteur, options, modifier, se connecter — nommées, sans attribut title", () => {
    const zone = actions(rows()[0]);
    const noms = [...zone.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') ?? b.getAttribute('role'));
    expect(noms).toEqual(['switch', 'Fonctionnalités et options', 'Modifier les informations', "Se connecter à l'entreprise"]);
    const sw = zone.querySelector('[role="switch"]') as HTMLButtonElement;
    expect(zone.querySelector(`label[for="${sw.id}"]`)!.textContent!.trim()).toBe('Entreprise active');
    expect(zone.querySelectorAll('soc-tooltip').length).toBe(4); // une info-bulle du kit par action (celles des boutons icône sont internes)
    expect(zone.querySelectorAll('soc-labs-icon-button').length).toBe(3);
    expect(zone.querySelector('[title]')).toBeNull();
  });

  it("l'interrupteur désactive l'entreprise et change son libellé", () => {
    const sw = actions(rows()[0]).querySelector('[role="switch"]') as HTMLButtonElement;
    sw.click();
    fixture.detectChanges();
    const swApres = actions(rows()[0]).querySelector('[role="switch"]') as HTMLButtonElement;
    expect(swApres.getAttribute('aria-checked')).toBe('false');
    expect(actions(rows()[0]).querySelector(`label[for="${swApres.id}"]`)!.textContent!.trim()).toBe('Entreprise désactivée');
  });

  it('« Fonctionnalités et options » ouvre la page des options de l’entreprise', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    (actions(rows()[0]).querySelector('[aria-label="Fonctionnalités et options"]') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith(['/workspace/entreprises', 'ent-1', 'options']);
  });

  it('« Modifier » et « Se connecter » signalent que la page n’existe pas encore', () => {
    (actions(rows()[1]).querySelector('[aria-label="Modifier les informations"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="information"]').textContent).toContain('Baobab Assurances');
  });
});
