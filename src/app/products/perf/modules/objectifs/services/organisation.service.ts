import { Injectable, computed, signal } from '@angular/core';
import { EMPLOYES } from '../../../../../../mocks/data/employes.mock';
import { AFFECTATIONS, PERIMETRE, POSTES_ORGANISATION, STRUCTURES } from '../../../../../../mocks/data/organisation.mock';
import type { Collaborateur } from '../models/organisation.model';
import { dansPerimetre, initiales } from './objectifs-regles';

/**
 * Organigramme vu par Perfs (structures, postes, collaborateurs et périmètre de l'utilisateur connecté). Données
 * synchrones : les formulaires et filtres en ont besoin dès le premier rendu. Seul ce service changera avec une API.
 */
@Injectable({ providedIn: 'root' })
export class OrganisationService {
  readonly structures = signal(STRUCTURES);
  readonly postes = signal(POSTES_ORGANISATION);
  readonly perimetre = signal(PERIMETRE);

  /** Tous les collaborateurs de l'entreprise (y compris hors périmètre : ne jamais les afficher tels quels). */
  readonly tous = computed<Collaborateur[]>(() =>
    EMPLOYES.map((e) => {
      const a = AFFECTATIONS.find((x) => x.employeId === e.id)!;
      return {
        id: e.id,
        matricule: e.matricule,
        nomComplet: `${e.prenom} ${e.nom}`,
        initiales: initiales(e.prenom, e.nom),
        filiale: e.filiale,
        structureId: a.structureId,
        structure: this.structures().find((s) => s.id === a.structureId)!.nom,
        posteId: a.posteId,
        poste: this.postes().find((p) => p.id === a.posteId)!.intitule,
        managerId: a.managerId,
      };
    }),
  );

  /** Collaborateurs visibles par l'utilisateur connecté. */
  readonly collaborateurs = computed(() => dansPerimetre(this.tous(), this.structures(), this.perimetre()));

  readonly utilisateurId = computed(() => this.perimetre().utilisateurId);

  collaborateur(id: string): Collaborateur | undefined {
    return this.tous().find((c) => c.id === id);
  }
}
