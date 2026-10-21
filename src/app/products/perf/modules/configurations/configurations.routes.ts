import { Routes } from '@angular/router';
import { ONGLETS_CONFIGURATIONS, ONGLET_PAR_DEFAUT } from './configurations.tabs';

export const CONFIGURATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./configurations-page.component').then((m) => m.ConfigurationsPageComponent),
    title: 'Configurations',
    children: [
      { path: '', redirectTo: ONGLET_PAR_DEFAUT, pathMatch: 'full' },
      {
        path: 'notes-evaluation',
        loadComponent: () => import('./notes-evaluation/notes-evaluation-page.component').then((m) => m.NotesEvaluationPageComponent),
        title: "Notes d'évaluation",
      },
      ...ONGLETS_CONFIGURATIONS.filter((o) => !o.construit).map((o) => ({
        path: o.route,
        loadComponent: () => import('./components/onglet-a-venir.component').then((m) => m.OngletAVenirComponent),
        data: { libelle: o.libelle },
        title: o.libelle,
      })),
    ],
  },
];
