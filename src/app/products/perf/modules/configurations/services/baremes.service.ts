import { Injectable, inject } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { CONFIGURATION_NOTES, DEFINITIONS_NOTES } from '../../../../../../mocks/data/baremes-notes.mock';
import { SESSION_USER } from '../../../../../../mocks/data/session.mock';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import type { BaremeNote, ConfigurationNotes, DefinitionNote } from '../models/bareme.model';
import { maintenantIsoLocal } from './bareme';

const copie = (configuration: ConfigurationNotes): ConfigurationNotes => structuredClone(configuration);

/** Barèmes des notes d'évaluation (Perfs > Configurations) — état en mémoire, pas de backend. */
@Injectable({ providedIn: 'root' })
export class BaremesService {
  private readonly flags = inject(FeatureFlagsService);
  /** Lu au premier accès (pas à la construction) : le flag se force par l'URL de la page. */
  private enregistreCourant?: ConfigurationNotes;

  private get enregistre(): ConfigurationNotes {
    return (this.enregistreCourant ??= this.configurationInitiale());
  }

  private set enregistre(configuration: ConfigurationNotes) {
    this.enregistreCourant = configuration;
  }

  /**
   * Flag « Confidentialité du potentiel » inactif : la note Potentiel garde l'ancien comportement (« Visible sur
   * l'évaluation », ni message, ni résumé « Masquée pour l'évalué », ni liste des éléments masqués).
   */
  getDefinitions(): DefinitionNote[] {
    if (this.flags.actif('confidentialite-potentiel')) return DEFINITIONS_NOTES;
    return DEFINITIONS_NOTES.map((d) => (d.interrupteur === 'confidentialite' ? { ...d, interrupteur: 'visibilite', masquage: undefined } : d));
  }

  getConfiguration(): Observable<ConfigurationNotes> {
    return of(copie(this.enregistre)).pipe(delay(200));
  }

  /** Enregistre les barèmes : la dernière modification passe à l'utilisateur connecté, maintenant. */
  enregistrer(baremes: BaremeNote[]): Observable<ConfigurationNotes> {
    this.enregistre = { baremes: structuredClone(baremes), derniereModification: { par: SESSION_USER.name, le: maintenantIsoLocal() } };
    return of(copie(this.enregistre)).pipe(delay(200));
  }

  /** Flag « Confidentialité du potentiel » actif : la note Potentiel est masquée pour l'évalué par défaut. */
  private configurationInitiale(): ConfigurationNotes {
    const configuration = copie(CONFIGURATION_NOTES);
    if (this.flags.actif('confidentialite-potentiel')) {
      configuration.baremes = configuration.baremes.map((b) => (b.id === 'potentiel' ? { ...b, actif: false } : b));
    }
    return configuration;
  }
}
