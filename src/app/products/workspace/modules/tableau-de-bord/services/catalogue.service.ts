import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { PRODUITS_SOUSCRITS } from '../../../../../../mocks/data/abonnements.mock';
import { INDICATEURS, SECTIONS_CATALOGUE } from '../../../../../../mocks/data/indicateurs.mock';
import { SERIES_INDICATEURS } from '../../../../../../mocks/data/indicateurs-series.mock';
import type { Indicateur, SerieIndicateur } from '../models/indicateur.model';
import { construireCatalogue, type SectionAvecIndicateurs } from './catalogue';

/** Accès au catalogue d'indicateurs (lecture seule) et à leurs séries fictives. */
@Injectable({ providedIn: 'root' })
export class CatalogueService {
  getCatalogue(): Observable<SectionAvecIndicateurs[]> {
    return of(construireCatalogue(SECTIONS_CATALOGUE, INDICATEURS, PRODUITS_SOUSCRITS)).pipe(delay(200));
  }

  getIndicateurs(): Observable<Indicateur[]> {
    return of(structuredClone(INDICATEURS)).pipe(delay(200));
  }

  getSeries(): Observable<SerieIndicateur[]> {
    return of(structuredClone(SERIES_INDICATEURS)).pipe(delay(200));
  }
}
