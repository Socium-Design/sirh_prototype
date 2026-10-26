import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { FEATURE_FLAGS } from '../../../mocks/data/feature-flags.mock';

export type FeatureFlagId = 'confidentialite-potentiel';

export interface FeatureFlag {
  id: FeatureFlagId;
  libelle: string;
  /** Valeur par défaut, hors forçage par l'URL. */
  actif: boolean;
}

/**
 * Feature flags simulés (mock `feature-flags.mock.ts`). Un flag se force depuis l'URL, pour une démo :
 * `?ff-confidentialite-potentiel=off` (ou `=on`). L'URL est relue à chaque appel.
 */
@Injectable({ providedIn: 'root' })
export class FeatureFlagsService {
  private readonly document = inject(DOCUMENT);

  actif(id: FeatureFlagId): boolean {
    const force = new URLSearchParams(this.document.location.search).get(`ff-${id}`);
    if (force === 'off') return false;
    if (force === 'on') return true;
    return this.flag(id).actif;
  }

  libelle(id: FeatureFlagId): string {
    return this.flag(id).libelle;
  }

  private flag(id: FeatureFlagId): FeatureFlag {
    return FEATURE_FLAGS.find((f) => f.id === id)!;
  }
}
