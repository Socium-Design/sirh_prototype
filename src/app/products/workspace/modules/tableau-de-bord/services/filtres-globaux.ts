import type { Employe, StatutPaie } from '../../employes/models/employe.model';

/**
 * Filtres globaux de la consultation : ils s'appliquent à toutes les cartes du tableau de bord. Chaque filtre liste les
 * valeurs incluses (cases cochées).
 */
export interface FiltresGlobaux {
  statutEmploye: ('Actif' | 'Sorti')[];
  statutCompte: ('Actif' | 'Désactivé')[];
  compteConfigure: ('Oui' | 'Non')[];
  statutPaie: StatutPaie[];
}

export type CleFiltreGlobal = keyof FiltresGlobaux;

/** Définition d'un filtre global : libellé et valeurs proposées. */
export const DEFINITIONS_FILTRES_GLOBAUX: { cle: CleFiltreGlobal; libelle: string; valeurs: string[] }[] = [
  { cle: 'statutEmploye', libelle: "Statut de l'employé", valeurs: ['Actif', 'Sorti'] },
  { cle: 'statutCompte', libelle: 'Statut du compte', valeurs: ['Actif', 'Désactivé'] },
  { cle: 'compteConfigure', libelle: 'Compte configuré', valeurs: ['Oui', 'Non'] },
  { cle: 'statutPaie', libelle: 'Statut paie', valeurs: ['En paie', 'Suspendu', 'Sorti de paie'] },
];

/** Par défaut, les employés sortis et les comptes désactivés sont exclus ; l'utilisateur les coche pour les inclure. */
export const FILTRES_GLOBAUX_PAR_DEFAUT: FiltresGlobaux = {
  statutEmploye: ['Actif'],
  statutCompte: ['Actif'],
  compteConfigure: ['Oui', 'Non'],
  statutPaie: ['En paie', 'Suspendu', 'Sorti de paie'],
};

/** « Sorti » côté filtre = statut « Inactif » de l'employé. */
const statutEmploye = (e: Employe): 'Actif' | 'Sorti' => (e.statut === 'Actif' ? 'Actif' : 'Sorti');

/** Employés retenus par les filtres globaux (ET entre filtres, OU entre les valeurs cochées d'un filtre). */
export function appliquerFiltresGlobaux(employes: Employe[], filtres: FiltresGlobaux): Employe[] {
  return employes.filter(
    (e) =>
      filtres.statutEmploye.includes(statutEmploye(e)) &&
      filtres.statutCompte.includes(e.statutCompte) &&
      filtres.compteConfigure.includes(e.compteConfigure ? 'Oui' : 'Non') &&
      filtres.statutPaie.includes(e.statutPaie),
  );
}

/**
 * Filtres d'une carte qui contredisent les filtres globaux : le global l'emporte, la carte ne les applique pas.
 * Seul le filtre de carte « Statut » (Actif / Inactif) recouvre un filtre global (statut de l'employé).
 */
export function filtresEnConflit(filtres: string[], globaux: FiltresGlobaux): string[] {
  return filtres.filter((f) => {
    if (f === 'statut:Actif') return !globaux.statutEmploye.includes('Actif');
    if (f === 'statut:Inactif') return !globaux.statutEmploye.includes('Sorti');
    return false;
  });
}

export const filtresGlobauxParDefaut = (): FiltresGlobaux => structuredClone(FILTRES_GLOBAUX_PAR_DEFAUT);
