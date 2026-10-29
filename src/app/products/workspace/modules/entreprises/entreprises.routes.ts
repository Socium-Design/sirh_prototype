import { Routes } from '@angular/router';

export const ENTREPRISES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./entreprises-page.component').then((m) => m.EntreprisesPageComponent),
    title: 'Entreprises',
  },
  {
    path: ':id/options',
    loadComponent: () => import('./options/options-entreprise-page.component').then((m) => m.OptionsEntreprisePageComponent),
    title: 'Fonctionnalités et options',
  },
];
