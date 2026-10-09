import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { GABARITS } from '../../../../../../mocks/data/gabarits.mock';
import { INDICATEURS, SECTIONS_CATALOGUE } from '../../../../../../mocks/data/indicateurs.mock';
import { TABLEAUX_DE_BORD } from '../../../../../../mocks/data/tableaux-de-bord.mock';
import type { ReglesPopulation } from '../../configuration/populations/models/population.model';
import { copierRegles } from '../../configuration/populations/services/population-regles';
import type { ModeleBase, TableauDeBord, TableauDeBordSaisie } from '../models/tableau-de-bord.model';

const LATENCE = 200;

/** Ce que la composition enregistre (bouton « Enregistrer ») : graphes, sections, statut et profils. */
export type Composition = Pick<TableauDeBord, 'widgets' | 'sections' | 'statut' | 'profils'>;

/**
 * Accès aux tableaux de bord du client. Simule une API sur le mock partagé ; les modifications vivent en mémoire le temps
 * de la session (copie du mock, jamais modifié).
 */
@Injectable({ providedIn: 'root' })
export class TableauxDeBordService {
  private tableaux: TableauDeBord[] = structuredClone(TABLEAUX_DE_BORD);
  private sequence = 0;

  getAll(): Observable<TableauDeBord[]> {
    return of(structuredClone(this.tableaux)).pipe(delay(LATENCE));
  }

  getById(id: string): Observable<TableauDeBord | undefined> {
    return of(structuredClone(this.tableaux.find((t) => t.id === id))).pipe(delay(LATENCE));
  }

  /** Crée un tableau de bord ; le modèle de base choisi pré-remplit ses graphes et ses profils. */
  create(saisie: TableauDeBordSaisie, modele: ModeleBase): Observable<TableauDeBord> {
    const gabarit = GABARITS.find((g) => g.id === modele);
    if (!gabarit) return throwError(() => new Error(`Modèle inconnu : ${modele}`));
    const tableau: TableauDeBord = {
      ...nettoyer(saisie),
      id: this.nouvelId('tdb'),
      modele,
      profils: [...gabarit.profils],
      sections: SECTIONS_CATALOGUE.map((s) => ({ id: s.id, libelle: s.libelle })),
      widgets: gabarit.indicateurs.map((indicateurId) => ({
        id: this.nouvelId('w'),
        indicateurId,
        sectionId: INDICATEURS.find((i) => i.id === indicateurId)!.sectionId,
        filtres: [],
      })),
      creeLe: new Date().toISOString().slice(0, 10),
    };
    this.tableaux = [...this.tableaux, tableau];
    return of(structuredClone(tableau)).pipe(delay(LATENCE));
  }

  /** Met à jour les informations (modale de modification). */
  update(id: string, saisie: TableauDeBordSaisie): Observable<TableauDeBord> {
    return this.modifier(id, (t) => {
      if (t.populationId !== saisie.populationId) delete t.reglesFigees;
      Object.assign(t, nettoyer(saisie));
    });
  }

  /** Enregistre la composition (bouton « Enregistrer » de la page de composition). */
  enregistrerComposition(id: string, composition: Composition): Observable<TableauDeBord> {
    return this.modifier(id, (t) => Object.assign(t, structuredClone(composition)));
  }

  /** Copie complète, nommée « X (copie) ». */
  dupliquer(id: string): Observable<TableauDeBord> {
    const source = this.tableaux.find((t) => t.id === id);
    if (!source) return throwError(() => new Error(`Tableau de bord inconnu : ${id}`));
    const copie: TableauDeBord = {
      ...structuredClone(source),
      id: this.nouvelId('tdb'),
      libelle: `${source.libelle} (copie)`,
      widgets: source.widgets.map((w) => ({ ...structuredClone(w), id: this.nouvelId('w') })),
      creeLe: new Date().toISOString().slice(0, 10),
    };
    this.tableaux = [...this.tableaux, copie];
    return of(structuredClone(copie)).pipe(delay(LATENCE));
  }

  remove(id: string): Observable<void> {
    this.tableaux = this.tableaux.filter((t) => t.id !== id);
    return of(undefined).pipe(delay(LATENCE));
  }

  /**
   * Modification d'une population : les tableaux `idsSuivants` suivent la nouvelle version ; les autres tableaux de cette
   * population gardent l'ancienne (figée), comme choisi dans la modale d'impact.
   */
  appliquerModificationPopulation(populationId: string, idsSuivants: string[], anciennes: ReglesPopulation): Observable<void> {
    for (const t of this.tableaux.filter((t) => t.populationId === populationId)) {
      if (idsSuivants.includes(t.id)) delete t.reglesFigees;
      else t.reglesFigees ??= copierRegles(anciennes);
    }
    return of(undefined).pipe(delay(LATENCE));
  }

  /** Suppression d'une population : les tableaux `ids` la perdent (population « — »). */
  retirerPopulation(populationId: string, ids: string[]): Observable<void> {
    for (const t of this.tableaux.filter((t) => t.populationId === populationId && ids.includes(t.id))) {
      t.populationId = null;
      delete t.reglesFigees;
    }
    return of(undefined).pipe(delay(LATENCE));
  }

  private modifier(id: string, changement: (t: TableauDeBord) => void): Observable<TableauDeBord> {
    const tableau = this.tableaux.find((t) => t.id === id);
    if (!tableau) return throwError(() => new Error(`Tableau de bord inconnu : ${id}`));
    changement(tableau);
    return of(structuredClone(tableau)).pipe(delay(LATENCE));
  }

  private nouvelId(prefixe: string): string {
    return `${prefixe}-${Date.now().toString(36)}-${++this.sequence}`;
  }
}

const nettoyer = (saisie: TableauDeBordSaisie): TableauDeBordSaisie => ({
  ...saisie,
  libelle: saisie.libelle.trim(),
  description: saisie.description.trim(),
});
