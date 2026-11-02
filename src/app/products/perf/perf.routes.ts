import { Routes } from '@angular/router';

/** Perfs : « Objectifs » et « Configurations » sont construits ; les autres items du menu mènent à « Bientôt disponible ». */
export const PERF_ROUTES: Routes = [
  { path: '', redirectTo: 'configurations', pathMatch: 'full' },
  {
    path: 'objectifs',
    loadChildren: () => import('./modules/objectifs/objectifs.routes').then((m) => m.OBJECTIFS_ROUTES),
  },
  {
    path: 'configurations',
    loadChildren: () => import('./modules/configurations/configurations.routes').then((m) => m.CONFIGURATIONS_ROUTES),
  },
];
