import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { EMPLOYES } from '../../../../../../mocks/data/employes.mock';
import type { Employe } from '../models/employe.model';

/** Accès aux employés. Simule un appel HTTP sur le mock partagé ; seul ce service changera quand une vraie API existera. */
@Injectable({ providedIn: 'root' })
export class EmployesService {
  getAll(): Observable<Employe[]> {
    return of(EMPLOYES).pipe(delay(200));
  }
}
