import { Routes } from '@angular/router';
import { OffresPageComponent } from './modules/offres/offres-page.component';

export const JOB_ROUTES: Routes = [
  { path: '', redirectTo: 'offres', pathMatch: 'full' },
  { path: 'offres', component: OffresPageComponent, title: 'Offres' },
];
