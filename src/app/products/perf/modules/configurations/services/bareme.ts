import type { BaremeNote, Decimales, DefinitionNote } from '../models/bareme.model';

export const DENOMINATEUR_MIN = 1;
export const DENOMINATEUR_MAX = 1000;

/** Boutons « Choix rapide » d'une carte de barème. */
export const CHOIX_RAPIDES = [5, 10, 20, 50, 100];

/** Score utilisé par l'aperçu d'une carte (« Un score évalué à 82 % s'affichera : … »). */
export const SCORE_APERCU = 82;

/**
 * Score en pourcentage ramené sur le barème, avec la virgule décimale française et le nombre de décimales demandé :
 * `noteSurBareme(82, 20, 2)` → « 16,40 ».
 */
export function noteSurBareme(pourcentage: number, denominateur: number, decimales: Decimales): string {
  return ((pourcentage / 100) * denominateur).toLocaleString('fr-FR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

/** Message d'erreur du dénominateur, ou `null` s'il est valide (entier de 1 à 1000). */
export function erreurDenominateur(valeur: number | null): string | null {
  if (valeur === null || Number.isNaN(valeur)) return 'Le dénominateur est obligatoire.';
  if (!Number.isInteger(valeur) || valeur < DENOMINATEUR_MIN || valeur > DENOMINATEUR_MAX) {
    return `Saisissez un entier entre ${DENOMINATEUR_MIN} et ${DENOMINATEUR_MAX}.`;
  }
  return null;
}

/** Une carte d'activation (note objectif, note compétence) dont l'interrupteur est coupé : grisée, non modifiable. */
export function estDesactive(definition: DefinitionNote, bareme: BaremeNote): boolean {
  return definition.interrupteur === 'activation' && !bareme.actif;
}

/** Une carte désactivée n'est pas validée : son contenu n'est pas modifiable, il sera revu à l'activation. */
export function baremeValide(definition: DefinitionNote, bareme: BaremeNote): boolean {
  return estDesactive(definition, bareme) || erreurDenominateur(bareme.denominateur) === null;
}

/** Date ISO locale → « 20/08/2026 11:00 ». */
export function formaterDateModification(iso: string): string {
  const [date, heure = ''] = iso.split('T');
  const [annee, mois, jour] = date.split('-');
  return `${jour}/${mois}/${annee} ${heure.slice(0, 5)}`.trim();
}

/** Maintenant, en date ISO locale à la minute (`2026-10-21T19:42`). */
export function maintenantIsoLocal(maintenant = new Date()): string {
  const deux = (n: number) => String(n).padStart(2, '0');
  return `${maintenant.getFullYear()}-${deux(maintenant.getMonth() + 1)}-${deux(maintenant.getDate())}T${deux(maintenant.getHours())}:${deux(maintenant.getMinutes())}`;
}
