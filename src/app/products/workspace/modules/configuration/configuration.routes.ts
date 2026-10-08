import { Routes } from '@angular/router';

export const CONFIGURATION_ROUTES: Routes = [
  { path: '', redirectTo: 'populations', pathMatch: 'full' },
  {
    path: 'populations',
    loadComponent: () => import('./populations/populations-page.component').then((m) => m.PopulationsPageComponent),
    title: 'Populations',
  },
  {
    path: 'populations/nouvelle',
    loadComponent: () => import('./populations/population-form-page.component').then((m) => m.PopulationFormPageComponent),
    title: 'Créer une population',
  },
  {
    path: 'populations/:id/modifier',
    loadComponent: () => import('./populations/population-form-page.component').then((m) => m.PopulationFormPageComponent),
    title: 'Modifier la population',
  },
];
