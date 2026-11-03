import type { Objectif, StatutObjectif } from '../models/objectif.model';
import type { Collaborateur, Perimetre, SelectionPopulation, Structure } from '../models/organisation.model';

/** Une structure et toutes ses sous-structures (à n'importe quelle profondeur). */
export function sousStructures(structures: Structure[], id: string): Set<string> {
  const ids = new Set([id]);
  let ajout = true;
  while (ajout) {
    ajout = false;
    for (const s of structures) {
      if (s.parentId && ids.has(s.parentId) && !ids.has(s.id)) {
        ids.add(s.id);
        ajout = true;
      }
    }
  }
  return ids;
}

/** Collaborateurs sous un manager : N-1 seulement, ou toute la ligne (N-1, N-2…) si `recursif`. */
export function equipe(collaborateurs: Collaborateur[], managerId: string, recursif: boolean): Collaborateur[] {
  const directs = collaborateurs.filter((c) => c.managerId === managerId);
  if (!recursif) return directs;
  return directs.flatMap((c) => [c, ...equipe(collaborateurs, c.id, true)]);
}

/**
 * Employés visibles par l'utilisateur : ceux de ses structures (sous-structures comprises), sa ligne hiérarchique
 * (N-1, N-2…) et lui-même. Personne d'autre n'apparaît, ni dans la liste, ni dans la population d'un objectif.
 */
export function dansPerimetre(collaborateurs: Collaborateur[], structures: Structure[], perimetre: Perimetre): Collaborateur[] {
  const structureIds = new Set(perimetre.structureIds.flatMap((id) => [...sousStructures(structures, id)]));
  const hierarchie = new Set(equipe(collaborateurs, perimetre.utilisateurId, true).map((c) => c.id));
  return collaborateurs.filter((c) => c.id === perimetre.utilisateurId || structureIds.has(c.structureId) || hierarchie.has(c.id));
}

/**
 * Population d'un objectif : les employés du périmètre ciblés par la sélection (personnes nommées, structures avec
 * leurs sous-structures, ou postes), sans doublon, dans l'ordre alphabétique. Une sélection vide ne cible personne.
 */
export function resoudrePopulation(selection: SelectionPopulation, perimetre: Collaborateur[], structures: Structure[]): Collaborateur[] {
  const ids = new Set(selection.ids);
  let cibles: Collaborateur[];
  switch (selection.mode) {
    case 'personne':
      cibles = perimetre.filter((c) => ids.has(c.id));
      break;
    case 'structure': {
      const toutes = new Set(selection.ids.flatMap((id) => [...sousStructures(structures, id)]));
      cibles = perimetre.filter((c) => toutes.has(c.structureId));
      break;
    }
    case 'poste':
      cibles = perimetre.filter((c) => ids.has(c.posteId));
      break;
  }
  return [...cibles].sort((a, b) => a.nomComplet.localeCompare(b.nomComplet, 'fr'));
}

/** Statut affiché d'après la période, à la date de référence (ISO). */
export function statutObjectif(o: Pick<Objectif, 'debut' | 'fin'>, reference: string): StatutObjectif {
  if (o.fin < reference) return 'Passé';
  if (o.debut > reference) return 'À venir';
  return 'En cours';
}

/**
 * Progression (%) : moyenne des sous-objectifs pondérée par leur pondération s'il y en a ; sinon valeur courante /
 * valeur cible pour un objectif quantitatif ; sinon la progression saisie. Arrondie à 2 décimales, peut dépasser 100.
 */
export function progressionObjectif(o: Objectif, sousObjectifs: Objectif[] = []): number {
  let valeur: number;
  if (sousObjectifs.length) {
    const poids = sousObjectifs.reduce((s, x) => s + x.ponderation, 0);
    valeur = sousObjectifs.reduce((s, x) => s + progressionObjectif(x) * x.ponderation, 0) / (poids || 1);
  } else if (o.type === 'QUANTITATIVE') {
    valeur = o.valeurCible ? ((o.valeurCourante ?? 0) / o.valeurCible) * 100 : 0;
  } else {
    valeur = o.progression;
  }
  return Math.round(valeur * 100) / 100;
}

/** « 01/05/2026 - 30/11/2026 ». */
export function formatPeriode(debut: string, fin: string): string {
  return `${formatDate(debut)} - ${formatDate(fin)}`;
}

export function formatDate(iso: string): string {
  const [a, m, j] = iso.slice(0, 10).split('-');
  return `${j}/${m}/${a}`;
}

/** « 16/10/2026 · 10:38 » depuis « 2026-10-16T10:38 ». */
export function formatDateHeure(iso: string): string {
  return `${formatDate(iso)} · ${iso.slice(11, 16)}`;
}

export function initiales(prenom: string, nom: string): string {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase();
}
