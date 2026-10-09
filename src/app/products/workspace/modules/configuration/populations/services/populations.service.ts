import { Injectable, inject } from '@angular/core';
import { Observable, delay, map, of, switchMap, throwError } from 'rxjs';
import { POPULATIONS } from '../../../../../../../mocks/data/populations.mock';
import { TableauxDeBordService } from '../../../tableau-de-bord/services/tableaux-de-bord.service';
import type { Population, PopulationSaisie, PopulationUsage } from '../models/population.model';
import { copierRegles } from './population-regles';

const LATENCE = 200;

/** Usage d'une population : un tableau de bord qui la prend pour périmètre. */
export interface UsagePopulation extends PopulationUsage {
  populationId: string;
}

/**
 * Accès aux populations. Simule une API sur le mock partagé : les modifications vivent en mémoire le temps de la session
 * (copie du mock, jamais modifié). Les usages d'une population sont les tableaux de bord qui la prennent pour périmètre.
 */
@Injectable({ providedIn: 'root' })
export class PopulationsService {
  private readonly tableaux = inject(TableauxDeBordService);
  private populations: Population[] = structuredClone(POPULATIONS);
  private sequence = 0;

  getAll(): Observable<Population[]> {
    return of(structuredClone(this.populations)).pipe(delay(LATENCE));
  }

  getById(id: string): Observable<Population | undefined> {
    return of(structuredClone(this.populations.find((p) => p.id === id))).pipe(delay(LATENCE));
  }

  /** Tableaux de bord qui utilisent chaque population. */
  getUsages(): Observable<UsagePopulation[]> {
    return this.tableaux
      .getAll()
      .pipe(map((tableaux) => tableaux.flatMap((t) => (t.populationId ? [{ id: t.id, libelle: t.libelle, populationId: t.populationId }] : []))));
  }

  create(saisie: PopulationSaisie): Observable<Population> {
    const population: Population = { ...depuisSaisie(saisie), id: `pop-${Date.now().toString(36)}-${++this.sequence}` };
    this.populations = [...this.populations, population];
    return of(structuredClone(population)).pipe(delay(LATENCE));
  }

  /**
   * Enregistre la population. Seuls les tableaux de bord `tableauxMisAJour` suivent la nouvelle version ; les autres
   * tableaux qui l'utilisent gardent la version précédente (figée), comme choisi dans la modale d'impact.
   */
  update(id: string, saisie: PopulationSaisie, tableauxMisAJour: string[]): Observable<Population> {
    const ancienne = this.populations.find((p) => p.id === id);
    if (!ancienne) return throwError(() => new Error(`Population inconnue : ${id}`));
    const population: Population = { ...depuisSaisie(saisie), id };
    this.populations = this.populations.map((p) => (p.id === id ? population : p));
    return this.tableaux.appliquerModificationPopulation(id, tableauxMisAJour, ancienne).pipe(map(() => structuredClone(population)));
  }

  /**
   * Retire la population des tableaux de bord `tableauxRetires`. Elle n'est supprimée du référentiel que lorsque plus aucun
   * tableau ne l'utilise ; les tableaux décochés dans la modale d'impact la conservent.
   */
  remove(id: string, tableauxRetires: string[]): Observable<void> {
    return this.tableaux.retirerPopulation(id, tableauxRetires).pipe(
      switchMap(() => this.getUsages()),
      map((usages) => {
        if (!usages.some((u) => u.populationId === id)) this.populations = this.populations.filter((p) => p.id !== id);
      }),
    );
  }
}

function depuisSaisie(saisie: PopulationSaisie): Omit<Population, 'id'> {
  return { nom: saisie.nom.trim(), description: saisie.description.trim(), ...copierRegles(saisie) };
}
