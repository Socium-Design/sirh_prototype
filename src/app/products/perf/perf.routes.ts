import { Routes } from '@angular/router';

/** Perfs : seule « Configurations » est construite ; les autres items du menu mènent à « Bientôt disponible ». */
export const PERF_ROUTES: Routes = [
  { path: '', redirectTo: 'configurations', pathMatch: 'full' },
  {
    path: 'configurations',
    loadChildren: () => import('./modules/configurations/configurations.routes').then((m) => m.CONFIGURATIONS_ROUTES),
  },
];
