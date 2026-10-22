import type {
  ConfigurationNotes,
  DefinitionNote,
} from '../../app/products/perf/modules/configurations/models/bareme.model';

/** Perfs > Configurations > Notes d'évaluation : les 5 notes et leur règle de calcul, dans l'ordre d'affichage. */
export const DEFINITIONS_NOTES: DefinitionNote[] = [
  {
    id: 'finale',
    titre: 'Note finale',
    libelleDenominateur: 'Dénominateur de la note finale',
    interrupteur: 'visibilite',
    regle:
      'Moyenne pondérée de trois familles de blocs, indépendante du regroupement Potentiel/Performance : chaque section notée, le bloc Objectifs et le bloc Compétences de fiche de poste. Un bloc vide est retiré du calcul plutôt que compté comme 0. Les pénalités RH se soustraient ensuite au moment de l’arbitrage.',
  },
  {
    id: 'potentiel',
    titre: 'Note Potentiel',
    libelleDenominateur: 'Dénominateur de la note potentiel',
    interrupteur: 'visibilite',
    regle:
      'Moyenne pondérée du bloc Compétences (hors compétences additionnelles) et des sections contenant des questions « potentiel ». Les objectifs n’entrent jamais dans cet axe. Un bloc vide est retiré du calcul.',
  },
  {
    id: 'performance',
    titre: 'Note Performance',
    libelleDenominateur: 'Dénominateur de la note performance',
    interrupteur: 'visibilite',
    regle:
      'Moyenne pondérée du bloc Objectifs et des sections contenant des questions « performance ». Les compétences n’entrent jamais dans cet axe. Un bloc vide est retiré du calcul.',
  },
  {
    id: 'objectif',
    titre: 'Note objectif',
    libelleDenominateur: 'Dénominateur de la note objectif',
    interrupteur: 'activation',
    regle:
      'S’applique uniquement à la note affichée dans l’en-tête de la section Objectifs : la moyenne des objectifs et sous-objectifs de la section, pondérée par le poids de chaque objectif. Les notes de chaque objectif ne changent pas : un objectif qualitatif garde le dénominateur de ses paliers.',
    mentionDesactive: 'Barème désactivé : objectifs affichés sur 100',
  },
  {
    id: 'competence',
    titre: 'Note compétence',
    libelleDenominateur: 'Dénominateur de la note compétence',
    interrupteur: 'activation',
    regle:
      'S’applique uniquement à la note affichée dans l’en-tête de la section Compétences : la moyenne simple des compétences de la fiche de poste, hors compétences additionnelles. Les notes de chaque compétence ne changent pas.',
    mentionDesactive: 'Barème désactivé : compétences affichées sur 100',
  },
];

/** Réglages enregistrés (les barèmes objectif et compétence, nouveaux, sont désactivés par défaut). */
export const CONFIGURATION_NOTES: ConfigurationNotes = {
  baremes: [
    { id: 'finale', actif: true, denominateur: 20, decimales: 2, appliquerAuxFinalisees: false },
    { id: 'potentiel', actif: true, denominateur: 20, decimales: 2, appliquerAuxFinalisees: false },
    { id: 'performance', actif: true, denominateur: 20, decimales: 2, appliquerAuxFinalisees: false },
    { id: 'objectif', actif: false, denominateur: 5, decimales: 1, appliquerAuxFinalisees: false },
    { id: 'competence', actif: false, denominateur: 5, decimales: 1, appliquerAuxFinalisees: false },
  ],
  derniereModification: { par: 'Admin Test Manu', le: '2026-08-20T11:00' },
};
