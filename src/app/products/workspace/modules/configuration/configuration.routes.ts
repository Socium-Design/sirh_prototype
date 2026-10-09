import { Routes } from '@angular/router';
import { ONGLETS_CONFIGURATION } from './configuration.tabs';

export const CONFIGURATION_ROUTES: Routes = [
  // Pages hors onglets (détail, composition), déclarées avant la page à onglets. Les formulaires sont des modales.
  {
    path: 'populations/:id',
    loadComponent: () => import('./populations/population-detail-page.component').then((m) => m.PopulationDetailPageComponent),
    title: 'Population',
  },
  {
    path: 'tableaux-de-bord/:id',
    loadComponent: () =>
      import('./tableaux-de-bord/tableau-de-bord-composition-page.component').then((m) => m.TableauDeBordCompositionPageComponent),
    title: 'Composition du tableau de bord',
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
