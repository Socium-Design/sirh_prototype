/** Les 5 notes d'une évaluation Perfs qui ont un barème (dans l'ordre de la page Configurations > Notes d'évaluation). */
export type NoteId = 'finale' | 'potentiel' | 'performance' | 'objectif' | 'competence';

/** Nombre de décimales affichées pour une note. */
export type Decimales = 0 | 1 | 2;

/**
 * Ce que fait l'interrupteur d'en-tête d'une carte : « Visible sur l'évaluation » (la note reste paramétrable même
 * masquée), « Visible par l'évalué » (désactivé : managers et RH voient la note, l'évalué un cadenas ; barème
 * toujours modifiable) ou « Activer le barème » (désactivé : la note s'affiche sur 100 et la carte est grisée).
 */
export type InterrupteurBareme = 'visibilite' | 'confidentialite' | 'activation';

/** Icône d'une ligne de « Ce qui sera mis à jour ». */
export type IconeMiseAJour =
  | 'resultats'
  | 'kpi'
  | 'exports'
  | 'ninebox'
  | 'section'
  | 'formulaire'
  | 'soumission'
  | 'detail'
  | 'profil'
  | 'historique'
  | 'pdf'
  | 'excel';

/** Une ligne de « Ce qui sera mis à jour » : « titre — texte » (texte facultatif). */
export interface LigneMiseAJour {
  icone: IconeMiseAJour;
  titre: string;
  texte?: string;
}

/** Ce que l'évalué ne voit plus quand l'interrupteur « Visible par l'évalué » est coupé (cadenas à la place). */
export interface MasquagePourEvalue {
  lignes: LigneMiseAJour[];
  /** Mention sous la liste (« S'applique à toutes les évaluations, passées comprises. »). */
  portee: string;
}

/** Description fixe d'une note (libellés, règle de calcul). */
export interface DefinitionNote {
  id: NoteId;
  titre: string;
  libelleDenominateur: string;
  interrupteur: InterrupteurBareme;
  regle: string;
  /** Mention affichée quand le barème est désactivé (interrupteur `activation` seulement). */
  mentionDesactive?: string;
  /** Zone « Ce qui sera mis à jour » de la carte. */
  misesAJour: LigneMiseAJour[];
  /** Contenu de cette zone quand la note est masquée pour l'évalué (interrupteur `confidentialite` seulement). */
  masquage?: MasquagePourEvalue;
}

/** Réglage d'une note, modifiable par l'administrateur. */
export interface BaremeNote {
  id: NoteId;
  /** Visible sur l'évaluation (`visibilite`), visible par l'évalué (`confidentialite`) ou barème activé (`activation`). */
  actif: boolean;
  /** Entier de 1 à 1000 ; `null` = champ vidé (invalide). */
  denominateur: number | null;
  decimales: Decimales;
  appliquerAuxFinalisees: boolean;
}

export interface DerniereModification {
  par: string;
  /** Date ISO locale (`2026-08-20T11:00`). */
  le: string;
}

export interface ConfigurationNotes {
  baremes: BaremeNote[];
  derniereModification: DerniereModification;
}
