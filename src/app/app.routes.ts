import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      {
        path: 'workspace',
        loadChildren: () => import('./products/workspace/workspace.routes').then(m => m.WORKSPACE_ROUTES)
      },
      {
        path: 'perf',
        loadChildren: () => import('./products/perf/perf.routes').then(m => m.PERF_ROUTES)
      },
      {
        path: 'job',
        loadChildren: () => import('./products/job/job.routes').then(m => m.JOB_ROUTES)
      },
      {
        path: 'a-venir/:id',
        loadComponent: () => import('./shared/pages/a-venir-page.component').then(m => m.AVenirPageComponent),
        title: 'Bientôt disponible'
      },
      { path: '', redirectTo: 'workspace', pathMatch: 'full' }
    ]
  }
];
