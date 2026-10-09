import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { PopulationDetailPageComponent } from './population-detail-page.component';

describe('PopulationDetailPageComponent', () => {
  let fixture: ComponentFixture<PopulationDetailPageComponent>;
  let navigate: jasmine.Spy;
  const el = () => fixture.nativeElement as HTMLElement;
  const dialogue = () => document.body.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement | null;
  const detecter = () => {
    fixture.detectChanges();
    tick(1000);
    fixture.detectChanges();
  };

  const ouvrir = (id: string) => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id }) } } }] });
    navigate = spyOn(TestBed.inject(Router), 'navigateByUrl');
    fixture = TestBed.createComponent(PopulationDetailPageComponent);
    detecter();
  };

  afterEach(() => fixture.destroy());

  it('nom, description, effectif, opérateur logique et conditions numérotées', fakeAsync(() => {
    ouvrir('pop-6');
    expect(el().querySelector('h1')?.textContent).toContain('Managers – périmètre hiérarchique');
    expect(el().textContent).toContain('Retour aux populations');
    expect(el().textContent).toContain('Collaborateurs en CDI des sites de Dakar et Thiès.');
    expect(el().textContent).toContain('7 personnes concernées');
    expect(el().textContent).toContain('OPÉRATEUR LOGIQUE');
    const conditions = [...el().querySelectorAll('[data-testid="condition"]')].map((li) => li.textContent?.trim());
    expect(conditions).toEqual(['Type de contrat est CDI', 'Site est Dakar, Thiès']);
    expect(el().querySelector('[data-testid="conditions"] ol')).not.toBeNull();
  }));

  it('« Modifier » ouvre la modale du formulaire', fakeAsync(() => {
    ouvrir('pop-6');
    (el().querySelector('[data-testid="modifier"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(dialogue()?.textContent).toContain('Modifier la population');
  }));

  it('« Supprimer » : confirmation, suppression puis retour à la liste', fakeAsync(() => {
    ouvrir('pop-7');
    (el().querySelector('[data-testid="supprimer"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(dialogue()?.textContent).toContain('Supprimer la population ?');
    ([...dialogue()!.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Supprimer') as HTMLButtonElement).click();
    detecter();
    expect(navigate).toHaveBeenCalledWith('/workspace/configuration/populations');
  }));

  it('revient à la liste si la population n’existe pas', fakeAsync(() => {
    ouvrir('inconnue');
    expect(navigate).toHaveBeenCalledWith('/workspace/configuration/populations');
  }));
});
