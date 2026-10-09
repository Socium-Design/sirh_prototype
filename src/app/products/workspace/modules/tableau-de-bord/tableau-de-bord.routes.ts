import { Routes } from '@angular/router';

export const TABLEAU_DE_BORD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./tableau-de-bord-page.component').then((m) => m.TableauDeBordPageComponent),
    title: 'Tableau de bord',
  },
];
