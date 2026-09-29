import { Routes } from '@angular/router';
import { FormationPageComponent } from './modules/formation/formation-page.component';
import { EvaluationPageComponent } from './modules/evaluation/evaluation-page.component';
import { ObjectifsPageComponent } from './modules/objectifs/objectifs-page.component';

export const PERF_ROUTES: Routes = [
  { path: '', redirectTo: 'formation', pathMatch: 'full' },
  { path: 'formation', component: FormationPageComponent, title: 'Formation' },
  { path: 'evaluation', component: EvaluationPageComponent, title: 'Évaluation' },
  { path: 'objectifs', component: ObjectifsPageComponent, title: 'Objectifs' },
];
