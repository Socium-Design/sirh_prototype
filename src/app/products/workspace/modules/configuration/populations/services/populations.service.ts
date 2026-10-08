import { Injectable, inject } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { POPULATIONS } from '../../../../../../../mocks/data/populations.mock';
import { POPULATION_USAGES } from '../../../../../../../mocks/data/population-usages.mock';
import { SessionService } from '../../../../../../core/session/session.service';
import type { Population, PopulationSaisie, PopulationUsage } from '../models/population.model';
import { copierRegles } from './population-regles';

const LATENCE = 200;

/**
 * Accès aux populations et à leurs usages. Simule une API sur le mock partagé : les modifications vivent en mémoire le temps
 * de la session (copie des mocks, jamais modifiés). Seul ce service changera quand une vraie API existera.
 */
@Injectable({ providedIn: 'root' })
export class PopulationsService {
  private readonly session = inject(SessionService);
  private populations: Population[] = structuredClone(POPULATIONS);
  private usages: PopulationUsage[] = structuredClone(POPULATION_USAGES);

  getAll(): Observable<Population[]> {
    return of(structuredClone(this.populations)).pipe(delay(LATENCE));
  }

  getUsages(): Observable<PopulationUsage[]> {
    return of(structuredClone(this.usages)).pipe(delay(LATENCE));
  }

  create(saisie: PopulationSaisie): Observable<Population> {
    const user = this.session.user();
    const population: Population = {
      ...this.depuisSaisie(saisie),
      id: `pop-${Date.now()}`,
      creePar: { nom: user.name, email: user.email },
      modifieeLe: aujourdhui(),
    };
    this.populations = [...this.populations, population];
    return of(structuredClone(population)).pipe(delay(LATENCE));
  }

  /**
   * Enregistre de nouvelles règles. Seuls les usages de `usagesMisAJour` suivent la nouvelle version ; les autres usages de
   * la population gardent la version précédente (figée), comme choisi dans la modale d'impact.
   */
  update(id: string, saisie: PopulationSaisie, usagesMisAJour: string[]): Observable<Population> {
    const ancienne = this.populations.find((p) => p.id === id);
    if (!ancienne) throw new Error(`Population inconnue : ${id}`);
    const population: Population = { ...ancienne, ...this.depuisSaisie(saisie), modifieeLe: aujourdhui() };
    this.populations = this.populations.map((p) => (p.id === id ? population : p));
    this.usages = this.usages.map((u) => {
      if (u.populationId !== id) return u;
      if (usagesMisAJour.includes(u.id)) return { ...u, versionFigee: undefined };
      return { ...u, versionFigee: u.versionFigee ?? copierRegles(ancienne) };
    });
    return of(structuredClone(population)).pipe(delay(LATENCE));
  }

  /**
   * Retire la population des usages `usagesRetires`. Elle n'est supprimée du référentiel que lorsque plus aucun élément
   * ne l'utilise ; les éléments décochés dans la modale d'impact la conservent.
   */
  remove(id: string, usagesRetires: string[]): Observable<void> {
    this.usages = this.usages.filter((u) => !(u.populationId === id && usagesRetires.includes(u.id)));
    if (!this.usages.some((u) => u.populationId === id)) this.populations = this.populations.filter((p) => p.id !== id);
    return of(undefined).pipe(delay(LATENCE));
  }

  private depuisSaisie(saisie: PopulationSaisie) {
    return { nom: saisie.nom.trim(), description: saisie.description.trim(), ...copierRegles(saisie) };
  }
}

function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}
