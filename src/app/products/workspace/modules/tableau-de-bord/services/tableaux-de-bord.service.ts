import { Injectable, inject } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { INDICATEURS, SECTIONS_CATALOGUE } from '../../../../../../mocks/data/indicateurs.mock';
import { INDICATEURS_V0, TABLEAUX_DE_BORD } from '../../../../../../mocks/data/tableaux-de-bord.mock';
import { SessionService } from '../../../../../core/session/session.service';
import type { Indicateur } from '../models/indicateur.model';
import type { PointDeDepart, SectionTableau, StatutTableauDeBord, TableauDeBord, TableauDeBordSaisie, Widget } from '../models/tableau-de-bord.model';

const LATENCE = 200;

/** Vrai si le tableau peut être activé : il doit avoir été prévisualisé au moins une fois. */
export const peutEtreActive = (tableau: TableauDeBord): boolean => tableau.statut !== 'Actif' && tableau.previsualise;

/**
 * Accès aux tableaux de bord du client. Simule une API sur le mock partagé ; les modifications vivent en mémoire le temps
 * de la session (copie du mock, jamais modifié).
 */
@Injectable({ providedIn: 'root' })
export class TableauxDeBordService {
  private readonly session = inject(SessionService);
  private tableaux: TableauDeBord[] = structuredClone(TABLEAUX_DE_BORD);
  private sequence = 0;

  /**
   * Brouillon du formulaire de création, conservé quand on part modifier les critères de la population
   * (page Populations) puis qu'on revient : rien n'est perdu.
   */
  brouillon: { id: string | null; saisie: TableauDeBordSaisie; depart: PointDeDepart } | null = null;

  getAll(): Observable<TableauDeBord[]> {
    return of(structuredClone(this.tableaux)).pipe(delay(LATENCE));
  }

  getById(id: string): Observable<TableauDeBord | undefined> {
    return of(structuredClone(this.tableaux.find((t) => t.id === id))).pipe(delay(LATENCE));
  }

  /** Indicateurs de la composition « V0 » proposée par défaut à la création. */
  getIndicateursV0(): Observable<Indicateur[]> {
    return of(INDICATEURS_V0.map((id) => structuredClone(INDICATEURS.find((i) => i.id === id)!))).pipe(delay(LATENCE));
  }

  /**
   * Crée un tableau de bord. Il est toujours « Inactif » : il ne pourra être activé qu'après une prévisualisation.
   * Ses sections et widgets viennent du point de départ (copies indépendantes).
   */
  create(saisie: TableauDeBordSaisie, depart: PointDeDepart): Observable<TableauDeBord> {
    const source = depart.type === 'copie' ? this.tableaux.find((t) => t.id === depart.sourceId) : undefined;
    if (depart.type === 'copie' && !source) return throwError(() => new Error(`Tableau de bord inconnu : ${depart.sourceId}`));
    const user = this.session.user();
    const tableau: TableauDeBord = {
      ...nettoyer(saisie),
      id: this.nouvelId('tdb'),
      statut: 'Inactif',
      sections: source ? structuredClone(source.sections) : sectionsDuCatalogue(),
      widgets: source ? source.widgets.map((w) => ({ ...structuredClone(w), id: this.nouvelId('w') })) : depart.type === 'v0' ? this.widgetsV0() : [],
      creePar: { nom: user.name, email: user.email },
      creeLe: new Date().toISOString().slice(0, 10),
      previsualise: false,
    };
    this.tableaux = [...this.tableaux, tableau];
    return of(structuredClone(tableau)).pipe(delay(LATENCE));
  }

  /** Met à jour les informations générales (pas la composition, gérée dans la Bibliothèque). */
  update(id: string, saisie: TableauDeBordSaisie): Observable<TableauDeBord> {
    const tableau = this.tableaux.find((t) => t.id === id);
    if (!tableau) return throwError(() => new Error(`Tableau de bord inconnu : ${id}`));
    if (saisie.statut === 'Actif' && tableau.statut !== 'Actif' && !tableau.previsualise)
      return throwError(() => new Error('Prévisualisez le tableau de bord avant de l’activer.'));
    Object.assign(tableau, nettoyer(saisie));
    return of(structuredClone(tableau)).pipe(delay(LATENCE));
  }

  /** Change le statut ; l'activation est refusée tant que le tableau n'a pas été prévisualisé. */
  changerStatut(id: string, statut: StatutTableauDeBord): Observable<TableauDeBord> {
    const tableau = this.tableaux.find((t) => t.id === id);
    if (!tableau) return throwError(() => new Error(`Tableau de bord inconnu : ${id}`));
    if (statut === 'Actif' && !peutEtreActive(tableau)) return throwError(() => new Error('Prévisualisez le tableau de bord avant de l’activer.'));
    tableau.statut = statut;
    return of(structuredClone(tableau)).pipe(delay(LATENCE));
  }

  private widgetsV0(): Widget[] {
    return INDICATEURS_V0.map((indicateurId) => ({
      id: this.nouvelId('w'),
      indicateurId,
      sectionId: INDICATEURS.find((i) => i.id === indicateurId)!.sectionId,
      filtres: [],
    }));
  }

  private nouvelId(prefixe: string): string {
    return `${prefixe}-${Date.now().toString(36)}-${++this.sequence}`;
  }
}

/** Sections d'un tableau neuf : celles du catalogue (renommables ensuite pour ce tableau). */
const sectionsDuCatalogue = (): SectionTableau[] => SECTIONS_CATALOGUE.map((s) => ({ id: s.id, libelle: s.libelle }));

const nettoyer = (saisie: TableauDeBordSaisie): TableauDeBordSaisie => ({
  ...saisie,
  libelle: saisie.libelle.trim(),
  description: saisie.description.trim(),
});
