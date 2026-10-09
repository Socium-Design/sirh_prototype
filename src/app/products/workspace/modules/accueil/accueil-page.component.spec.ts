import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../../app.routes';

describe('AccueilPageComponent', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    harness = await RouterTestingHarness.create();
  });

  it("ouvre le prototype sur l'accueil du Workspace (et non sur Postes)", async () => {
    await harness.navigateByUrl('/');
    expect(TestBed.inject(Router).url).toBe('/workspace/accueil');
    await harness.navigateByUrl('/workspace');
    expect(TestBed.inject(Router).url).toBe('/workspace/accueil');
  });

  it('affiche le bandeau de bienvenue et l’emplacement du futur intranet', async () => {
    await harness.navigateByUrl('/workspace/accueil');
    harness.detectChanges();
    const el = harness.routeNativeElement as HTMLElement;
    expect(el.textContent).toContain('Bienvenue Absatou Diallo');
    expect(el.textContent).toContain("L'intranet du Workspace sera affiché ici.");
  });
});
