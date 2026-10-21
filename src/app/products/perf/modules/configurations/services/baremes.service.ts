import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { CONFIGURATION_NOTES, DEFINITIONS_NOTES } from '../../../../../../mocks/data/baremes-notes.mock';
import { SESSION_USER } from '../../../../../../mocks/data/session.mock';
import type { BaremeNote, ConfigurationNotes, DefinitionNote } from '../models/bareme.model';
import { maintenantIsoLocal } from './bareme';

const copie = (configuration: ConfigurationNotes): ConfigurationNotes => structuredClone(configuration);

/** Barèmes des notes d'évaluation (Perfs > Configurations) — état en mémoire, pas de backend. */
@Injectable({ providedIn: 'root' })
export class BaremesService {
  private enregistre = copie(CONFIGURATION_NOTES);

  getDefinitions(): DefinitionNote[] {
    return DEFINITIONS_NOTES;
  }

  getConfiguration(): Observable<ConfigurationNotes> {
    return of(copie(this.enregistre)).pipe(delay(200));
  }

  /** Enregistre les barèmes : la dernière modification passe à l'utilisateur connecté, maintenant. */
  enregistrer(baremes: BaremeNote[]): Observable<ConfigurationNotes> {
    this.enregistre = { baremes: structuredClone(baremes), derniereModification: { par: SESSION_USER.name, le: maintenantIsoLocal() } };
    return of(copie(this.enregistre)).pipe(delay(200));
  }
}
