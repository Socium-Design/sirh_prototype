import { Routes } from '@angular/router';

export const ACCUEIL_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./accueil-page.component').then((m) => m.AccueilPageComponent), title: 'Accueil' },
];
