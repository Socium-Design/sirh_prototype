import type { EtatObjectif, EvenementObjectif, Objectif, TypeObjectif } from '../../app/products/perf/modules/objectifs/models/objectif.model';

const ADMIN = { par: 'Absatou Diallo', role: 'Admin RH' };

interface Graine {
  titre: string;
  debut: string;
  fin: string;
  type?: TypeObjectif;
  progression?: number;
  cible?: number;
  courante?: number;
  ponderation?: number;
  etat?: EtatObjectif;
  /** Sous-objectifs : [titre, employé assigné, progression]. */
  sous?: Array<[string, string, number]>;
}

/** Objectifs de 4 collaborateurs du périmètre (Awa Diop 13, Cissé Mariama 6, Moussa Ndiaye 5, Absatou Diallo 3). */
const GRAINES: Record<string, Graine[]> = {
  '1': [
    { titre: 'Migrer le portail RH vers Angular 19', debut: '2026-05-01', fin: '2026-11-30', progression: 60, ponderation: 4 },
    {
      titre: 'Fiabiliser la chaîne de déploiement',
      debut: '2026-01-15',
      fin: '2026-12-15',
      ponderation: 3,
      sous: [
        ['Automatiser les tests de bout en bout', '1', 40],
        ['Mettre en place les environnements de recette', '9', 20],
      ],
    },
    { titre: 'Réduire le temps de chargement des pages', debut: '2026-03-01', fin: '2026-12-31', type: 'QUANTITATIVE', cible: 50, courante: 30, ponderation: 2 },
    { titre: 'Développement PHP du module congés', debut: '2026-08-19', fin: '2026-08-26', progression: 80, ponderation: 5 },
    { titre: 'Documenter les composants partagés', debut: '2026-07-01', fin: '2026-07-14', progression: 0, ponderation: 1 },
    { titre: "Former deux développeurs à l'accessibilité", debut: '2026-04-21', fin: '2026-04-30', type: 'QUANTITATIVE', cible: 2, courante: 2, ponderation: 1 },
    { titre: 'Corriger les anomalies critiques', debut: '2026-01-01', fin: '2026-12-31', type: 'QUANTITATIVE', cible: 40, courante: 26, ponderation: 2 },
    { titre: 'Préparer la migration des données 2027', debut: '2026-11-15', fin: '2027-02-28', progression: 0, ponderation: 2 },
    { titre: 'Revue de code systématique', debut: '2026-02-01', fin: '2026-09-30', progression: 100, ponderation: 1, etat: 'cloture' },
    { titre: 'Audit de sécurité applicative', debut: '2026-09-01', fin: '2026-12-31', progression: 10, ponderation: 2, etat: 'a_valider' },
    { titre: 'Mettre à jour les dépendances front', debut: '2026-10-01', fin: '2026-10-31', progression: 50, ponderation: 1 },
    { titre: 'Accompagner les nouveaux arrivants', debut: '2026-01-01', fin: '2026-12-31', progression: 70, ponderation: 1 },
    { titre: 'Réduire la dette technique', debut: '2026-06-01', fin: '2026-12-31', type: 'QUANTITATIVE', cible: 100, courante: 35, ponderation: 3, etat: 'soumis' },
  ],
  '12': [
    {
      titre: 'Livrer le module Perfs',
      debut: '2026-01-01',
      fin: '2026-12-31',
      ponderation: 4,
      sous: [
        ['Cadrer les besoins avec les RH', '12', 100],
        ['Piloter la recette utilisateur', '12', 30],
        ['Former les utilisateurs clés', '16', 0],
      ],
    },
    { titre: 'Tenir le budget du projet', debut: '2026-01-01', fin: '2026-12-31', type: 'QUANTITATIVE', cible: 100, courante: 92, ponderation: 2 },
    { titre: 'Animer les comités de pilotage', debut: '2026-01-01', fin: '2026-06-30', progression: 100, ponderation: 1 },
    { titre: 'Satisfaction des parties prenantes', debut: '2026-04-01', fin: '2026-12-31', progression: 65, ponderation: 2 },
    { titre: 'Planifier la feuille de route 2027', debut: '2026-11-01', fin: '2026-12-31', progression: 0, ponderation: 1 },
    { titre: 'Objectif de communication interne', debut: '2026-03-01', fin: '2026-03-31', progression: 100, ponderation: 1, etat: 'cloture' },
  ],
  '2': [
    { titre: 'Pourvoir les postes ouverts du T4', debut: '2026-10-01', fin: '2026-12-31', type: 'QUANTITATIVE', cible: 8, courante: 3, ponderation: 3 },
    { titre: 'Réduire le délai moyen de recrutement', debut: '2026-01-01', fin: '2026-12-31', type: 'QUANTITATIVE', cible: 30, courante: 47.21, ponderation: 2 },
    { titre: "Refondre le parcours d'intégration", debut: '2026-05-01', fin: '2026-09-30', progression: 90, ponderation: 2 },
    { titre: 'Développer la marque employeur', debut: '2026-01-01', fin: '2026-12-31', progression: 45, ponderation: 1 },
    { titre: 'Participer à deux salons écoles', debut: '2026-02-01', fin: '2026-05-31', progression: 100, ponderation: 1, etat: 'a_valider' },
  ],
  '8': [
    { titre: 'Déployer le plan de formation 2026', debut: '2026-01-01', fin: '2026-12-31', progression: 75, ponderation: 3 },
    { titre: 'Taux de réalisation des entretiens annuels', debut: '2026-01-01', fin: '2026-12-31', type: 'QUANTITATIVE', cible: 100, courante: 88, ponderation: 2 },
    { titre: 'Mettre en place les objectifs par structure', debut: '2026-10-01', fin: '2026-12-31', progression: 20, ponderation: 2 },
  ],
};

function historique(id: string, titre: string, assigne: string, debut: string): EvenementObjectif[] {
  const jour = debut < '2026-10-16' ? debut : '2026-10-16';
  return [
    { id: `${id}-h1`, type: 'ajout_soumis', le: `${jour}T10:37`, ...ADMIN, motif: 'Objectif fixé lors de l’entretien annuel' },
    {
      id: `${id}-h2`,
      type: 'ajout_valide',
      le: `${jour}T10:38`,
      ...ADMIN,
      details: [
        { libelle: 'Objectif créé', valeur: titre },
        { libelle: 'Personne assignée', valeur: assigne },
      ],
    },
  ];
}

/** Noms des employés assignés (repris de `employes.mock.ts`) pour l'historique. */
const NOMS: Record<string, string> = {
  '1': 'Awa Diop',
  '2': 'Moussa Ndiaye',
  '8': 'Absatou Diallo',
  '9': 'Mamadou Faye',
  '12': 'Mariama Cissé',
  '16': 'Rokhaya Seck',
};

function construire(): Objectif[] {
  const objectifs: Objectif[] = [];
  let n = 0;
  for (const [employeId, graines] of Object.entries(GRAINES)) {
    for (const g of graines) {
      const id = `obj-${++n}`;
      const type = g.type ?? 'QUALITATIVE';
      objectifs.push({
        id,
        titre: g.titre,
        description: '',
        elementMesure: '',
        employeId,
        debut: g.debut,
        fin: g.fin,
        type,
        progression: g.progression ?? 0,
        valeurCible: g.cible,
        valeurCourante: g.courante,
        ponderation: g.ponderation ?? 1,
        aEvaluer: true,
        origine: 'Objectif libre',
        etat: g.etat ?? 'actif',
        historique: historique(id, g.titre, NOMS[employeId], g.debut),
      });
      for (const [titre, assigne, progression] of g.sous ?? []) {
        const sousId = `obj-${++n}`;
        objectifs.push({
          id: sousId,
          titre,
          description: '',
          elementMesure: '',
          employeId: assigne,
          debut: g.debut,
          fin: g.fin,
          type: 'QUALITATIVE',
          progression,
          ponderation: 1,
          aEvaluer: true,
          origine: 'Objectif libre',
          etat: 'actif',
          parentId: id,
          historique: historique(sousId, titre, NOMS[assigne], g.debut),
        });
      }
    }
  }
  return objectifs;
}

/** Objectifs fictifs de Perfs > Objectifs. Date de référence (statuts « En cours » / « Passé ») : `DATE_DONNEES`. */
export const OBJECTIFS: Objectif[] = construire();
