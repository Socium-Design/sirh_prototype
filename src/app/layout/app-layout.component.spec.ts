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
          { path: '', component: AppLayoutComponent, children: [{ path: 'workspace/employes', component: StubPage }, { path: 'perf/formation', component: StubPage }, { path: 'a-venir/:id', component: StubPage }] },
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
    await harness.navigateByUrl('/perf/formation');
    harness.detectChanges();
    expect(root.querySelector('soc-side-navigation')?.textContent).toContain('Perfs');
    expect(selected(root)).toBe('Formations');
  });

  it('un clic sur un item sans page mène à « bientôt disponible »', async () => {
    const { root, router, harness } = await setup('/workspace/employes');
    const structures = [...root.querySelectorAll('soc-side-navigation button')].find((b) => b.textContent?.trim() === 'Structures') as HTMLButtonElement;
    structures.click();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/a-venir/workspace-structures');
  });
});
