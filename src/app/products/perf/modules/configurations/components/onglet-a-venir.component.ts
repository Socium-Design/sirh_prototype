import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SocMessage, SocMessageContent } from '@socium-design/angular-components';

/** Contenu d'un onglet de Configurations pas encore construit dans le prototype. */
@Component({
  selector: 'app-onglet-a-venir',
  imports: [SocMessage, SocMessageContent],
  template: `
    <soc-message variant="banner" status="info" title="À venir">
      <span socMessageContent>L'onglet « {{ libelle }} » n'est pas encore construit dans le prototype.</span>
    </soc-message>
  `,
})
export class OngletAVenirComponent {
  protected readonly libelle: string = inject(ActivatedRoute).snapshot.data['libelle'] ?? '';
}
