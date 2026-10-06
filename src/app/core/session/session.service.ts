import { Injectable, signal } from '@angular/core';
import type { EnterpriseOption, LanguageOption } from '@socium-design/angular-components';
import { SESSION_ENTERPRISES, SESSION_LANGUAGES, SESSION_USER } from '../../../mocks/data/session.mock';

/**
 * Session du prototype (utilisateur, entreprise active, langue). Les valeurs viennent du mock partagé ;
 * elles sont disponibles de façon synchrone parce que le shell (header) en a besoin dès le premier rendu.
 * Le jour où une vraie API existe, seul ce service change.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly user = signal(SESSION_USER);
  readonly enterprises = signal<EnterpriseOption[]>(SESSION_ENTERPRISES);
  readonly languages = signal<LanguageOption[]>(SESSION_LANGUAGES);
  readonly enterprise = signal<string | undefined>(SESSION_ENTERPRISES[0].value);
  readonly language = signal<string | undefined>(SESSION_LANGUAGES[0].value);
}
