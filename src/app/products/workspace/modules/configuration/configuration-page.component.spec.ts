import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, type Route } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CONFIGURATION_ROUTES } from './configuration.routes';
import { ONGLETS_CONFIGURATION, ongletDepuisUrl } from './configuration.tabs';

describe('ConfigurationPageComponent (page à onglets)', () => {
  let harness: RouterTestingHarness;
  const el = () => harness.routeNativeElement as HTMLElement;
  const onglets = () => [...el().querySelectorAll('[role="tab"]')] as HTMLButtonElement[];
  const actif = () => onglets().find((o) => o.getAttribute('aria-selected') === 'true')?.textContent?.trim();
  const ouvrir = async (url: string) => {
    await harness.navigateByUrl(url);
    harness.detectChanges();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'workspace/configuration', children: CONFIGURATION_ROUTES }])] });
    harness = await RouterTestingHarness.create();
  });

  it('redirige /workspace/configuration vers le premier onglet', async () => {
    await ouvrir('/workspace/configuration');
    expect(TestBed.inject(Router).url).toBe('/workspace/configuration/populations');
    expect(actif()).toBe('Populations');
    expect(el().querySelector('soc-data-table')).not.toBeNull();
  });

  it("redirige l'ancien onglet « Gabarits » vers la gestion des tableaux de bord", async () => {
    await ouvrir('/workspace/configuration/gabarits');
    expect(TestBed.inject(Router).url).toBe('/workspace/configuration/tableaux-de-bord');
    expect(actif()).toBe('Gestion des tableaux de bord');
  });

  it('affiche un onglet par entrée de la liste de configuration, dans l’ordre', async () => {
    await ouvrir('/workspace/configuration/populations');
    expect(onglets().map((o) => o.textContent?.trim())).toEqual(ONGLETS_CONFIGURATION.map((o) => o.libelle));
  });

  it("active l'onglet d'après l'URL", async () => {
    await ouvrir('/workspace/configuration/tableaux-de-bord');
    expect(actif()).toBe('Gestion des tableaux de bord');
    expect(el().querySelector('app-tableaux-de-bord-page')).not.toBeNull();
    expect(el().querySelector('app-populations-page')).toBeNull();
  });

  it("change d'URL au clic sur un onglet", async () => {
    await ouvrir('/workspace/configuration/populations');
    onglets()[1].click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/workspace/configuration/tableaux-de-bord');
    expect(actif()).toBe('Gestion des tableaux de bord');
  });

  it('affiche les formulaires en plein écran, sans onglets', async () => {
    await ouvrir('/workspace/configuration/populations/nouvelle');
    expect(el().querySelector('soc-page-form')).not.toBeNull();
    expect(onglets().length).toBe(0);
  });

  it('chaque onglet déclaré a sa route enfant', () => {
    const enfants = (CONFIGURATION_ROUTES.find((r) => r.path === '')?.children ?? []) as Route[];
    for (const onglet of ONGLETS_CONFIGURATION) expect(enfants.some((r) => r.path === onglet.route)).withContext(onglet.route).toBeTrue();
  });
});

describe('ongletDepuisUrl', () => {
  it('trouve l’onglet d’une page, de ses sous-pages et ignore la query string', () => {
    expect(ongletDepuisUrl('/workspace/configuration/populations')?.route).toBe('populations');
    expect(ongletDepuisUrl('/workspace/configuration/populations/pop-1/modifier?x=1')?.route).toBe('populations');
    expect(ongletDepuisUrl('/workspace/configuration/tableaux-de-bord#haut')?.route).toBe('tableaux-de-bord');
  });

  it("ne trouve rien hors de la configuration ou pour un onglet inconnu", () => {
    expect(ongletDepuisUrl('/workspace/configuration')).toBeUndefined();
    expect(ongletDepuisUrl('/workspace/configuration/inconnu')).toBeUndefined();
    expect(ongletDepuisUrl('/workspace/employes')).toBeUndefined();
  });
});
