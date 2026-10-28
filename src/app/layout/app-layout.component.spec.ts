import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AppLayoutComponent } from './app-layout.component';

@Component({ template: 'page' })
class StubPage {}

describe('AppLayoutComponent', () => {
  async function setup(url: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: AppLayoutComponent, children: [{ path: 'workspace/employes', component: StubPage }, { path: 'workspace/entreprises', component: StubPage }, { path: 'workspace/configuration', component: StubPage }, { path: 'workspace/configuration/tableaux-de-bord', component: StubPage }, { path: 'workspace/entreprises/:id/options', component: StubPage }, { path: 'perf/configurations', component: StubPage }, { path: 'a-venir/:id', component: StubPage }] },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create(url);
    const root = harness.routeNativeElement as HTMLElement;
    return { harness, root, router: TestBed.inject(Router) };
  }
  const selected = (root: HTMLElement) =>
    [...root.querySelectorAll('soc-side-navigation button')].find((b) => b.className.includes('border-r-'))?.textContent?.trim();

  it('affiche le shell et surligne l\'item du menu correspondant à l\'URL', async () => {
    const { root } = await setup('/workspace/employes');
    expect(root.querySelector('soc-app-shell')).not.toBeNull();
    expect(selected(root)).toBe('Employés');
  });

  it('suit la navigation : produit et item changent avec l\'URL', async () => {
    const { harness, root } = await setup('/workspace/employes');
    await harness.navigateByUrl('/perf/configurations');
    harness.detectChanges();
    expect(root.querySelector('soc-side-navigation')?.textContent).toContain('Perfs');
    expect(selected(root)).toBe('Configurations');
  });

  it('un clic sur un item sans page mène à « bientôt disponible »', async () => {
    const { root, router, harness } = await setup('/workspace/employes');
    const pays = [...root.querySelectorAll('soc-side-navigation button')].find((b) => b.textContent?.trim() === 'Pays') as HTMLButtonElement;
    pays.click();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/a-venir/workspace-pays');
  });

  it('« Entreprises » mène à la liste et reste actif sur la page des options d’une entreprise', async () => {
    const { root, router, harness } = await setup('/workspace/employes');
    ([...root.querySelectorAll('soc-side-navigation button')].find((b) => b.textContent?.trim() === 'Entreprises') as HTMLButtonElement).click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.url).toBe('/workspace/entreprises');
    expect(selected(root)).toBe('Entreprises');
    await harness.navigateByUrl('/workspace/entreprises/ent-1/options?variante=b');
    harness.detectChanges();
    expect(selected(root)).toBe('Entreprises');
  });

  it('« Configurations » reste dans le menu Workspace et garde l’accès à Configuration > Tableaux de bord', async () => {
    const { root, router, harness } = await setup('/workspace/configuration/tableaux-de-bord');
    expect(selected(root)).toBe('Configurations');
    for (const libelle of ['Postes', 'Structures', 'Organigramme', 'Configurations']) {
      expect([...root.querySelectorAll('soc-side-navigation button')].some((b) => b.textContent?.trim() === libelle)).withContext(libelle).toBeTrue();
    }
    await harness.navigateByUrl('/workspace/employes');
    ([...root.querySelectorAll('soc-side-navigation button')].find((b) => b.textContent?.trim() === 'Configurations') as HTMLButtonElement).click();
    await harness.fixture.whenStable();
    expect(router.url.startsWith('/workspace/configuration')).toBeTrue();
  });
});
