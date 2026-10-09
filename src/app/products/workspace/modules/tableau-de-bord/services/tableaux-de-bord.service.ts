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

  /** Prévisualisation faite : le tableau devient activable. */
  marquerPrevisualise(id: string): Observable<TableauDeBord> {
    return this.modifier(id, (t) => (t.previsualise = true));
  }

  /** Ajoute un widget d'un indicateur, dans la section donnée (par défaut celle de l'indicateur dans le catalogue). */
  ajouterWidget(id: string, indicateurId: string, sectionId?: string): Observable<TableauDeBord> {
    const indicateur = INDICATEURS.find((i) => i.id === indicateurId);
    if (!indicateur) return throwError(() => new Error(`Indicateur inconnu : ${indicateurId}`));
    return this.modifier(id, (t) => t.widgets.push({ id: this.nouvelId('w'), indicateurId, sectionId: sectionId ?? indicateur.sectionId, filtres: [] }));
  }

  /**
   * Personnalise un widget. Un titre ou une description identiques au catalogue (ou vides) ne sont pas stockés :
   * le widget reste « par défaut ».
   */
  modifierWidget(id: string, widgetId: string, changes: Pick<Widget, 'titre' | 'description' | 'sectionId' | 'filtres'>): Observable<TableauDeBord> {
    return this.modifier(id, (t) => {
      const widget = t.widgets.find((w) => w.id === widgetId);
      const indicateur = INDICATEURS.find((i) => i.id === widget?.indicateurId);
      if (!widget || !indicateur) throw new Error(`Widget inconnu : ${widgetId}`);
      widget.titre = personnalisation(changes.titre, indicateur.titre);
      widget.description = personnalisation(changes.description, indicateur.description);
      widget.sectionId = changes.sectionId;
      widget.filtres = [...changes.filtres];
    });
  }

  /** « Réinitialiser » : retour au titre et à la description du catalogue (filtres et section conservés). */
  reinitialiserWidget(id: string, widgetId: string): Observable<TableauDeBord> {
    return this.modifier(id, (t) => {
      const widget = t.widgets.find((w) => w.id === widgetId);
      if (widget) {
        delete widget.titre;
        delete widget.description;
      }
    });
  }

  retirerWidget(id: string, widgetId: string): Observable<TableauDeBord> {
    return this.modifier(id, (t) => (t.widgets = t.widgets.filter((w) => w.id !== widgetId)));
  }

  /** Renomme une section pour ce tableau de bord uniquement. */
  renommerSection(id: string, sectionId: string, libelle: string): Observable<TableauDeBord> {
    if (!libelle.trim()) return throwError(() => new Error('Le nom de la section est obligatoire.'));
    return this.modifier(id, (t) => {
      const section = t.sections.find((s) => s.id === sectionId);
      if (section) section.libelle = libelle.trim();
    });
  }

  /** Change le statut ; l'activation est refusée tant que le tableau n'a pas été prévisualisé. */
  changerStatut(id: string, statut: StatutTableauDeBord): Observable<TableauDeBord> {
    const tableau = this.tableaux.find((t) => t.id === id);
    if (!tableau) return throwError(() => new Error(`Tableau de bord inconnu : ${id}`));
    if (statut === 'Actif' && !peutEtreActive(tableau)) return throwError(() => new Error('Prévisualisez le tableau de bord avant de l’activer.'));
    tableau.statut = statut;
    return of(structuredClone(tableau)).pipe(delay(LATENCE));
  }

  private modifier(id: string, changement: (t: TableauDeBord) => void): Observable<TableauDeBord> {
    const tableau = this.tableaux.find((t) => t.id === id);
    if (!tableau) return throwError(() => new Error(`Tableau de bord inconnu : ${id}`));
    try {
      changement(tableau);
    } catch (e) {
      return throwError(() => e);
    }
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

const personnalisation = (valeur: string | undefined, parDefaut: string): string | undefined => {
  const texte = valeur?.trim();
  return texte && texte !== parDefaut ? texte : undefined;
};

const nettoyer = (saisie: TableauDeBordSaisie): TableauDeBordSaisie => ({
  ...saisie,
  libelle: saisie.libelle.trim(),
  description: saisie.description.trim(),
});
