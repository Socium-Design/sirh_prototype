import { Routes } from '@angular/router';

export const OBJECTIFS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./objectifs-page.component').then((m) => m.ObjectifsPageComponent),
    title: 'Objectifs',
  },
  {
    path: 'nouveau',
    loadComponent: () => import('./objectif-form-page.component').then((m) => m.ObjectifFormPageComponent),
    data: { mode: 'creation' },
    title: "Création d'un objectif",
  },
  {
    path: ':id',
    loadComponent: () => import('./objectif-detail-page.component').then((m) => m.ObjectifDetailPageComponent),
    title: 'Objectif',
  },
  {
    path: ':id/modifier',
    loadComponent: () => import('./objectif-form-page.component').then((m) => m.ObjectifFormPageComponent),
    data: { mode: 'modification' },
    title: "Modification d'un objectif",
  },
];
