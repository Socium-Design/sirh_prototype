/** Les 5 notes d'une évaluation Perfs qui ont un barème (dans l'ordre de la page Configurations > Notes d'évaluation). */
export type NoteId = 'finale' | 'potentiel' | 'performance' | 'objectif' | 'competence';

/** Nombre de décimales affichées pour une note. */
export type Decimales = 0 | 1 | 2;

/**
 * Ce que fait l'interrupteur d'en-tête d'une carte : « Visible sur l'évaluation » (la note reste paramétrable même
 * masquée) ou « Activer le barème » (désactivé : la note s'affiche sur 100 et la carte est grisée).
 */
export type InterrupteurBareme = 'visibilite' | 'activation';

/** Description fixe d'une note (libellés, règle de calcul). */
export interface DefinitionNote {
  id: NoteId;
  titre: string;
  libelleDenominateur: string;
  interrupteur: InterrupteurBareme;
  regle: string;
  /** Mention affichée quand le barème est désactivé (interrupteur `activation` seulement). */
  mentionDesactive?: string;
}

/** Réglage d'une note, modifiable par l'administrateur. */
export interface BaremeNote {
  id: NoteId;
  /** Visible sur l'évaluation (`visibilite`) ou barème activé (`activation`). */
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
