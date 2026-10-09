import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { TABLEAUX_DE_BORD } from '../../../../../../mocks/data/tableaux-de-bord.mock';
import type { StatutTableauDeBord, TableauDeBord } from '../models/tableau-de-bord.model';

const LATENCE = 200;

/** Vrai si le tableau peut être activé : il doit avoir été prévisualisé au moins une fois. */
export const peutEtreActive = (tableau: TableauDeBord): boolean => tableau.statut !== 'Actif' && tableau.previsualise;

/**
 * Accès aux tableaux de bord du client. Simule une API sur le mock partagé ; les modifications vivent en mémoire le temps
 * de la session (copie du mock, jamais modifié).
 */
@Injectable({ providedIn: 'root' })
export class TableauxDeBordService {
  private tableaux: TableauDeBord[] = structuredClone(TABLEAUX_DE_BORD);

  getAll(): Observable<TableauDeBord[]> {
    return of(structuredClone(this.tableaux)).pipe(delay(LATENCE));
  }

  getById(id: string): Observable<TableauDeBord | undefined> {
    return of(structuredClone(this.tableaux.find((t) => t.id === id))).pipe(delay(LATENCE));
  }

  /** Change le statut ; l'activation est refusée tant que le tableau n'a pas été prévisualisé. */
  changerStatut(id: string, statut: StatutTableauDeBord): Observable<TableauDeBord> {
    const tableau = this.tableaux.find((t) => t.id === id);
    if (!tableau) return throwError(() => new Error(`Tableau de bord inconnu : ${id}`));
    if (statut === 'Actif' && !peutEtreActive(tableau)) return throwError(() => new Error('Prévisualisez le tableau de bord avant de l’activer.'));
    tableau.statut = statut;
    return of(structuredClone(tableau)).pipe(delay(LATENCE));
  }
}
