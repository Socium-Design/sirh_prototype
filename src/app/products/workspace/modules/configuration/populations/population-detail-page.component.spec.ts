import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { PopulationDetailPageComponent } from './population-detail-page.component';

describe('PopulationDetailPageComponent', () => {
  let fixture: ComponentFixture<PopulationDetailPageComponent>;
  const el = () => fixture.nativeElement as HTMLElement;

  const ouvrir = (id: string) => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id }) } } }] });
    fixture = TestBed.createComponent(PopulationDetailPageComponent);
    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();
  };

  afterEach(() => fixture.destroy());

  it('n’affiche que le nom, la description et les filtres', fakeAsync(() => {
    ouvrir('pop-1');
    expect(el().querySelector('h1')?.textContent).toContain('Équipe Sénégal');
    expect(el().textContent).toContain('Tous les collaborateurs de la filiale sénégalaise.');
    expect(el().querySelector('[data-testid="filtres"]')?.textContent).toContain('Filiale est Sénégal');
    // Pas de liste des tableaux de bord / modules qui l'utilisent.
    expect(el().textContent).not.toContain('Dashboard RH Global');
    expect(el().textContent).not.toContain('Utilisée par');
  }));

  it('« Modifier » ouvre le formulaire de la population', fakeAsync(() => {
    ouvrir('pop-6');
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    (el().querySelector('[data-testid="modifier"]') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith(['/workspace/configuration/populations', 'pop-6', 'modifier']);
  }));

  it('revient à la liste pour une population inconnue', fakeAsync(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'inconnue' }) } } }] });
    const navigateByUrl = spyOn(TestBed.inject(Router), 'navigateByUrl');
    fixture = TestBed.createComponent(PopulationDetailPageComponent);
    fixture.detectChanges();
    tick(300);
    expect(navigateByUrl).toHaveBeenCalledWith('/workspace/configuration/populations');
  }));
});
