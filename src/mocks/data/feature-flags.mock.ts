import type { FeatureFlag } from '../../app/core/feature-flags/feature-flags.service';

/**
 * Feature flags simulés du prototype (pas de service de flags réel). Chaque flag se force depuis l'URL pour une démo :
 * `?ff-<id>=off` (ou `=on`).
 */
export const FEATURE_FLAGS: FeatureFlag[] = [
  // Épique « Demande Seter », section 2 : l'évalué ne voit jamais ses notes de potentiel quand la carte est désactivée.
  { id: 'confidentialite-potentiel', libelle: 'Confidentialité du potentiel', actif: true },
];
