import { Routes } from '@angular/router';
import { PostesPageComponent } from './modules/postes/postes-page.component';
import { CompetencesPageComponent } from './modules/competences/competences-page.component';
import { EmployesPageComponent } from './modules/employes/employes-page.component';
import { CarrieresPageComponent } from './modules/carrieres/carrieres-page.component';

export const WORKSPACE_ROUTES: Routes = [
  // Le prototype s'ouvre sur l'accueil du Workspace (futur intranet).
  { path: '', redirectTo: 'accueil', pathMatch: 'full' },
  {
    path: 'accueil',
    loadChildren: () => import('./modules/accueil/accueil.routes').then((m) => m.ACCUEIL_ROUTES),
  },
  { path: 'postes', component: PostesPageComponent, title: 'Postes' },
  { path: 'competences', component: CompetencesPageComponent, title: 'Compétences' },
  { path: 'employes', component: EmployesPageComponent, title: 'Employés' },
  { path: 'carrieres', component: CarrieresPageComponent, title: 'Carrières' },
  {
    path: 'tableau-de-bord',
    loadChildren: () => import('./modules/tableau-de-bord/tableau-de-bord.routes').then((m) => m.TABLEAU_DE_BORD_ROUTES),
  },
  {
    path: 'configuration',
    loadChildren: () => import('./modules/configuration/configuration.routes').then((m) => m.CONFIGURATION_ROUTES),
  },
];
