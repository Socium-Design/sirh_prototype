import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CONFIGURATIONS_ROUTES } from './configurations.routes';

describe('Perfs > ConfigurationsPageComponent', () => {
  async function ouvrir(url: string) {
    TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'perf/configurations', children: CONFIGURATIONS_ROUTES }])] });
    const harness = await RouterTestingHarness.create(url);
    return { harness, root: harness.routeNativeElement! };
  }
  const texte = (e: Element | null | undefined) => e?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const onglets = (root: HTMLElement) => [...root.querySelectorAll('soc-tabs button')] as HTMLButtonElement[];

  it('titre, sous-titre, fil d’Ariane et 3 onglets ; s’ouvre sur « Notes d’évaluation »', async () => {
    const { harness, root } = await ouvrir('/perf/configurations');
    expect(texte(root.querySelector('h1'))).toBe('Configurations');
    expect(texte(root)).toContain(
      "Configurez vos objectifs qualitatifs et ajustez les critères d'appréciation en fonction de vos priorités et de votre contexte métier.",
    );
    expect(texte(root.querySelector('soc-breadcrumb'))).toContain('Configurations');
    expect(onglets(root).map((b) => texte(b))).toEqual(['Configuration des objectifs', "Notes d'évaluation", 'Parcours de validation']);
    expect(harness.routeNativeElement?.querySelector('app-notes-evaluation-page')).not.toBeNull();
  });

  it('les deux autres onglets affichent « À venir »', async () => {
    const { harness, root } = await ouvrir('/perf/configurations');
    onglets(root)[2].click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/perf/configurations/parcours-validation');
    expect(texte(harness.routeNativeElement?.querySelector('app-onglet-a-venir'))).toContain(
      "L'onglet « Parcours de validation » n'est pas encore construit dans le prototype.",
    );
  });
});
