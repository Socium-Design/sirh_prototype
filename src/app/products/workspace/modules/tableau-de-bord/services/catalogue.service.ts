import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { INDICATEURS_NON_SOUSCRITS } from '../../../../../../mocks/data/abonnements.mock';
import { GABARITS } from '../../../../../../mocks/data/gabarits.mock';
import { INDICATEURS, SECTIONS_CATALOGUE } from '../../../../../../mocks/data/indicateurs.mock';
import { SERIES_INDICATEURS } from '../../../../../../mocks/data/indicateurs-series.mock';
import type { Indicateur, SerieIndicateur } from '../models/indicateur.model';
import type { Gabarit } from '../models/tableau-de-bord.model';
import { construireCatalogue, type SectionAvecIndicateurs } from './catalogue';

/** Accès au catalogue d'indicateurs (lecture seule), à leurs séries fictives et aux gabarits de départ. */
@Injectable({ providedIn: 'root' })
export class CatalogueService {
  getCatalogue(): Observable<SectionAvecIndicateurs[]> {
    return of(construireCatalogue(SECTIONS_CATALOGUE, INDICATEURS, INDICATEURS_NON_SOUSCRITS)).pipe(delay(200));
  }

  getIndicateurs(): Observable<Indicateur[]> {
    return of(structuredClone(INDICATEURS)).pipe(delay(200));
  }

  getSeries(): Observable<SerieIndicateur[]> {
    return of(structuredClone(SERIES_INDICATEURS)).pipe(delay(200));
  }

  getGabarits(): Observable<Gabarit[]> {
    return of(structuredClone(GABARITS)).pipe(delay(200));
  }
}
