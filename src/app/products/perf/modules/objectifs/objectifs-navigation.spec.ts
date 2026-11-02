import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { PERF_ROUTES } from '../../perf.routes';

/** Parcours liste → détail → modification, avec les vraies routes paresseuses de Perfs. */
describe('Perfs > Objectifs — navigation', () => {
  let harness: RouterTestingHarness;
  const el = () => harness.routeNativeElement as HTMLElement;
  const attendre = async () => {
    await harness.fixture.whenStable();
    harness.detectChanges();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'perf', children: PERF_ROUTES }])] });
    harness = await RouterTestingHarness.create();
  });

  it('ouvre le détail depuis le titre, puis la modification depuis le crayon', async () => {
    await harness.navigateByUrl('/perf/objectifs');
    const lien = [...el().querySelectorAll('[data-testid="titre-objectif"]')].find((a) => a.textContent!.trim() === 'Migrer le portail RH vers Angular 19') as HTMLAnchorElement;
    lien.click();
    await attendre();
    expect(TestBed.inject(Router).url).toBe('/perf/objectifs/obj-1');
    expect(el().querySelector('h1')!.textContent).toContain('Migrer le portail RH vers Angular 19');
    expect(el().querySelector('[data-testid="statut"]')!.textContent!.trim()).toBe('En cours');
    expect(el().querySelector('[data-testid="section-infos"]')!.textContent).toContain('Awa Diop');
    expect(el().querySelector('[data-testid="sous-vide"]')!.textContent!.trim()).toBe('Aucun sous objectif ajouté');
    expect(el().querySelector('[data-testid="section-historique"]')!.textContent).toContain('Ajout validé');
    expect(el().querySelector('[data-testid="section-historique"]')!.textContent).toContain('Modification — changement des informations');

    (el().querySelector('[data-testid="modifier"]') as HTMLButtonElement).click();
    await attendre();
    expect(TestBed.inject(Router).url).toBe('/perf/objectifs/obj-1/modifier');
    expect(el().querySelector('[data-testid="bandeau-validation"]')).not.toBeNull();
  });

  it('affiche les sous-objectifs d\'un objectif parent dans son détail', async () => {
    await harness.navigateByUrl('/perf/objectifs/obj-2');
    const sous = el().querySelector('[data-testid="section-sous"]')!;
    expect(sous.textContent).toContain('Automatiser les tests de bout en bout');
    expect(sous.textContent).toContain('Mamadou Faye');
    expect(el().querySelector('[data-testid="mettre-a-jour"]')).toBeNull();
  });

  it('crée un objectif et le retrouve dans la liste, sous chaque employé concerné', async () => {
    await harness.navigateByUrl('/perf/objectifs/nouveau?employe=9');
    const form = (harness.routeDebugElement!.componentInstance as { form: { patchValue(v: object): void } }).form;
    form.patchValue({ titre: 'Objectif de test', periode: { debut: '2026-10-01', fin: '2026-12-31' }, type: 'QUALITATIVE' });
    harness.detectChanges();
    (el().querySelector('[data-testid="valider"]') as HTMLButtonElement).click();
    await attendre();
    expect(TestBed.inject(Router).url).toBe('/perf/objectifs');
    expect(el().querySelector('[data-testid="message"]')!.textContent!.trim()).toBe('Objectif créé pour 1 employé(s)');
    const groupe = [...el().querySelectorAll('tbody[data-group]')].find((g) => g.textContent!.includes('Mamadou Faye'))!;
    expect(groupe.textContent).toContain('Objectif de test');
  });
});
