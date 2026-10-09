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
      // Ancien onglet provisoire (en production depuis la PR #2), remplacé par la gestion des tableaux de bord.
      { path: 'gabarits', redirectTo: 'tableaux-de-bord' },
      // Une route par onglet de `ONGLETS_CONFIGURATION`.
      {
        path: 'populations',
        loadComponent: () => import('./populations/populations-page.component').then((m) => m.PopulationsPageComponent),
        title: 'Populations',
      },
      {
        path: 'tableaux-de-bord',
        loadComponent: () => import('./tableaux-de-bord/tableaux-de-bord-page.component').then((m) => m.TableauxDeBordPageComponent),
        title: 'Gestion des tableaux de bord',
      },
    ],
  },
];
