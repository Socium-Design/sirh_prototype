import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { INDICATEURS_NON_SOUSCRITS, PRODUITS, PRODUITS_SOUSCRITS } from '../../../../../../mocks/data/abonnements.mock';
import { GABARITS } from '../../../../../../mocks/data/gabarits.mock';
import { INDICATEURS, SECTIONS_CATALOGUE } from '../../../../../../mocks/data/indicateurs.mock';
import { SERIES_INDICATEURS } from '../../../../../../mocks/data/indicateurs-series.mock';
import { WORKFLOWS_PERSONNALISES } from '../../../../../../mocks/data/workflows-personnalises.mock';
import type { Indicateur, SerieIndicateur } from '../models/indicateur.model';
import type { Gabarit, Produit } from '../models/tableau-de-bord.model';
import type { WorkflowPersonnalise } from '../models/workflow.model';
import { construireCatalogue, type SectionAvecIndicateurs } from './catalogue';

/**
 * Accès au catalogue d'indicateurs (lecture seule), à leurs séries fictives, aux gabarits de départ, aux workflows
 * personnalisés du client et à ses produits souscrits.
 */
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

  getWorkflows(): Observable<WorkflowPersonnalise[]> {
    return of(structuredClone(WORKFLOWS_PERSONNALISES)).pipe(delay(200));
  }

  /** Produits souscrits par le client : seuls ceux-là peuvent porter un tableau de bord. */
  getProduitsSouscrits(): Observable<Produit[]> {
    return of(PRODUITS.filter((p) => PRODUITS_SOUSCRITS.includes(p.id)).map((p) => ({ ...p }))).pipe(delay(200));
  }
}
