import { Component, inject } from '@angular/core';
import { SocBreadcrumb, SocMessage, SocMessageContent, SocPageBreadcrumb, SocPageHome } from '@socium-design/angular-components';
import { SessionService } from '../../../../core/session/session.service';

/**
 * Workspace > Accueil — page d'arrivée du prototype. Contenu à venir : l'intranet du Workspace.
 * En attendant, seul le bandeau de bienvenue du template `soc-page-home` est affiché.
 */
@Component({
  selector: 'app-accueil-page',
  imports: [SocPageHome, SocPageBreadcrumb, SocBreadcrumb, SocMessage, SocMessageContent],
  template: `
    <soc-page-home welcomeLabel="Accueil" [welcomeTitle]="'Bienvenue ' + session.user().name" sectionTitle="Intranet">
      <soc-breadcrumb socPageBreadcrumb [items]="[{ label: 'Workspace' }, { label: 'Accueil' }]" />
      <soc-message variant="banner" status="info" title="Bientôt disponible">
        <span socMessageContent>L'intranet du Workspace sera affiché ici.</span>
      </soc-message>
    </soc-page-home>
  `,
})
export class AccueilPageComponent {
  protected readonly session = inject(SessionService);
}
