import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { CONFIGURATION_ROUTES } from '../configuration.routes';
import { quitterSansEnregistrer } from './quitter-sans-enregistrer.guard';

describe('quitterSansEnregistrer', () => {
  const garde = (peutQuitter: () => unknown) =>
    quitterSansEnregistrer({ peutQuitter } as never, {} as ActivatedRouteSnapshot, {} as RouterStateSnapshot, {} as RouterStateSnapshot);

  it('relaie la réponse de la page', () => {
    expect(garde(() => true)).toBeTrue();
    const reponse = of(false);
    expect(garde(() => reponse)).toBe(reponse);
  });

  it('protège la page de composition', () => {
    expect(CONFIGURATION_ROUTES.find((r) => r.path === 'tableaux-de-bord/:id')?.canDeactivate).toEqual([quitterSansEnregistrer]);
  });
});
