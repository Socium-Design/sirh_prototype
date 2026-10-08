import { Routes } from '@angular/router';
import { PostesPageComponent } from './modules/postes/postes-page.component';
import { CompetencesPageComponent } from './modules/competences/competences-page.component';
import { EmployesPageComponent } from './modules/employes/employes-page.component';
import { CarrieresPageComponent } from './modules/carrieres/carrieres-page.component';

export const WORKSPACE_ROUTES: Routes = [
  { path: '', redirectTo: 'postes', pathMatch: 'full' },
  { path: 'postes', component: PostesPageComponent, title: 'Postes' },
  { path: 'competences', component: CompetencesPageComponent, title: 'Compétences' },
  { path: 'employes', component: EmployesPageComponent, title: 'Employés' },
  { path: 'carrieres', component: CarrieresPageComponent, title: 'Carrières' },
  {
    path: 'configuration',
    loadChildren: () => import('./modules/configuration/configuration.routes').then((m) => m.CONFIGURATION_ROUTES),
  },
];
