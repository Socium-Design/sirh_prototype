import { Injectable, computed, signal } from '@angular/core';
import { OBJECTIFS } from '../../../../../../mocks/data/objectifs.mock';
import { SESSION_USER } from '../../../../../../mocks/data/session.mock';
import { maintenantIsoLocal } from '../../configurations/services/bareme';
import type { EvenementObjectif, Objectif, SaisieObjectif } from '../models/objectif.model';
import type { Collaborateur } from '../models/organisation.model';

const ROLE_UTILISATEUR = 'Admin RH';

/**
 * Objectifs (Perfs > Objectifs) — état en mémoire partagé par la liste, le détail et les formulaires (pas de backend).
 * Lecture par signaux ; chaque écriture remplace la liste.
 */
@Injectable({ providedIn: 'root' })
export class ObjectifsService {
  private readonly etat = signal<Objectif[]>(structuredClone(OBJECTIFS));
  private compteur = OBJECTIFS.length;

  readonly objectifs = this.etat.asReadonly();
  /** Sous-objectifs par id de parent. */
  readonly enfants = computed(() => {
    const parParent = new Map<string, Objectif[]>();
    for (const o of this.etat()) {
      if (o.parentId) parParent.set(o.parentId, [...(parParent.get(o.parentId) ?? []), o]);
    }
    return parParent;
  });

  private message: string | null = null;

  /** Message de succès à afficher sur la page suivante (après une création, une suppression…). */
  annoncer(message: string): void {
    this.message = message;
  }

  /** Lit le message en attente et l'efface (affiché une seule fois). */
  consommerMessage(): string | null {
    const message = this.message;
    this.message = null;
    return message;
  }

  objectif(id: string): Objectif | undefined {
    return this.etat().find((o) => o.id === id);
  }

  sousObjectifs(id: string): Objectif[] {
    return this.enfants().get(id) ?? [];
  }

  /** Crée un objectif par employé de la population (chacun a le sien, avec son historique). */
  creer(saisie: SaisieObjectif, population: Collaborateur[], parentId?: string): Objectif[] {
    const le = maintenantIsoLocal();
    const crees = population.map<Objectif>((c) => {
      const id = `obj-${++this.compteur}`;
      return {
        ...saisie,
        id,
        employeId: c.id,
        progression: 0,
        origine: 'Objectif libre',
        etat: 'actif',
        parentId,
        historique: [
          this.evenement(id, 'ajout_valide', le, undefined, [
            { libelle: 'Objectif créé', valeur: saisie.titre },
            { libelle: 'Personne assignée', valeur: c.nomComplet },
          ]),
        ],
      };
    });
    this.etat.update((liste) => [...liste, ...crees]);
    return crees;
  }

  /** Met à jour la progression (qualitatif) ou la valeur courante (quantitatif). */
  mettreAJour(id: string, valeur: number): void {
    this.modifier(id, (o) => {
      const avant = o.type === 'QUANTITATIVE' ? (o.valeurCourante ?? 0) : o.progression;
      const libelle = o.type === 'QUANTITATIVE' ? 'Valeur courante' : 'Progression';
      const suffixe = o.type === 'QUANTITATIVE' ? '' : ' %';
      return {
        ...o,
        ...(o.type === 'QUANTITATIVE' ? { valeurCourante: valeur } : { progression: valeur }),
        historique: [
          ...o.historique,
          this.evenement(o.id, 'mise_a_jour', maintenantIsoLocal(), undefined, [{ libelle, valeur: `${avant}${suffixe} → ${valeur}${suffixe}` }]),
        ],
      };
    });
  }

  /** La modification n'est pas appliquée : elle est soumise à validation (onglet « Soumis à validation »). */
  soumettreModification(id: string, saisie: SaisieObjectif, motif: string): void {
    this.modifier(id, (o) => {
      const details = CHAMPS.filter(([cle]) => o[cle] !== saisie[cle]).map(([cle, libelle]) => ({
        libelle,
        valeur: `${afficher(o[cle])} → ${afficher(saisie[cle])}`,
      }));
      return {
        ...o,
        etat: 'soumis',
        historique: [...o.historique, this.evenement(o.id, 'modification_soumise', maintenantIsoLocal(), motif, details)],
      };
    });
  }

  cloturer(id: string): void {
    this.modifier(id, (o) => ({ ...o, etat: 'cloture', historique: [...o.historique, this.evenement(o.id, 'cloture', maintenantIsoLocal())] }));
  }

  /** Supprime l'objectif et ses sous-objectifs. */
  supprimer(id: string): void {
    const ids = new Set([id, ...this.sousObjectifs(id).map((o) => o.id)]);
    this.etat.update((liste) => liste.filter((o) => !ids.has(o.id)));
  }

  private modifier(id: string, f: (o: Objectif) => Objectif): void {
    this.etat.update((liste) => liste.map((o) => (o.id === id ? f(o) : o)));
  }

  private evenement(
    objectifId: string,
    type: EvenementObjectif['type'],
    le: string,
    motif?: string,
    details?: EvenementObjectif['details'],
  ): EvenementObjectif {
    return { id: `${objectifId}-${type}-${le}-${Math.random().toString(36).slice(2, 6)}`, type, le, par: SESSION_USER.name, role: ROLE_UTILISATEUR, motif, details };
  }
}

const CHAMPS: Array<[keyof SaisieObjectif, string]> = [
  ['titre', 'Objectif'],
  ['description', 'Description'],
  ['elementMesure', 'Élément de mesure'],
  ['debut', 'Début'],
  ['fin', 'Fin'],
  ['type', "Type d'objectif"],
  ['valeurCible', 'Valeur cible'],
  ['valeurCourante', 'Valeur courante'],
  ['ponderation', 'Pondération'],
  ['aEvaluer', 'Objectif à évaluer'],
];

function afficher(v: unknown): string {
  if (v === true) return 'Oui';
  if (v === false) return 'Non';
  if (v === undefined || v === null || v === '') return '—';
  return String(v);
}
