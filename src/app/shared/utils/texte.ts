/**
 * Extrait d'un texte pour une cellule de tableau. Le tableau du kit ne gère ni largeur de colonne ni troncature
 * (GAP-DS design_system_angular#4) : un texte long pousserait les dernières colonnes hors champ.
 */
export function extrait(texte: string, longueur = 40): string {
  if (!texte) return '—';
  return texte.length > longueur ? `${texte.slice(0, longueur).trimEnd()}…` : texte;
}
