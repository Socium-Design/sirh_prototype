import { Routes } from '@angular/router';
import { ONGLETS_CONFIGURATION } from './configuration.tabs';

export const CONFIGURATION_ROUTES: Routes = [
  // Formulaires plein écran (soc-page-form n'a pas d'emplacement d'onglets) : déclarés avant la page à onglets.
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
  {
    path: '',
    loadComponent: () => import('./configuration-page.component').then((m) => m.ConfigurationPageComponent),
    children: [
      { path: '', redirectTo: ONGLETS_CONFIGURATION[0].route, pathMatch: 'full' },
      // Une route par onglet de `ONGLETS_CONFIGURATION`.
      {
        path: 'populations',
        loadComponent: () => import('./populations/populations-page.component').then((m) => m.PopulationsPageComponent),
        title: 'Populations',
      },
      {
        path: 'gabarits',
        loadComponent: () => import('./configuration-a-venir.component').then((m) => m.ConfigurationAVenirComponent),
        title: 'Gabarits / tableaux de bord',
      },
    ],
  },
];
