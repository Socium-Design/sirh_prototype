import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'workspace', pathMatch: 'full' },
  {
    path: 'workspace',
    loadChildren: () => import('./products/workspace/workspace.routes').then((m) => m.WORKSPACE_ROUTES),
  },
  {
    path: 'perf',
    loadChildren: () => import('./products/perf/perf.routes').then((m) => m.PERF_ROUTES),
  },
  {
    path: 'job',
    loadChildren: () => import('./products/job/job.routes').then((m) => m.JOB_ROUTES),
  },
  { path: '**', redirectTo: 'workspace' },
];
