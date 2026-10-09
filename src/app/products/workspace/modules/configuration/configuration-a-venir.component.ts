import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { SocMessage, SocMessageContent } from '@socium-design/angular-components';
import { filter, map } from 'rxjs';
import { ongletDepuisUrl } from './configuration.tabs';

/**
 * Contenu d'un onglet de configuration pas encore construit. Même message que la page « bientôt disponible »
 * (`a-venir-page`), mais sans son template de page : il s'affiche à l'intérieur de la page Configuration.
 */
@Component({
  selector: 'app-configuration-a-venir',
  imports: [SocMessage, SocMessageContent],
  template: `
    <soc-message variant="banner" status="info" title="Bientôt disponible">
      <span socMessageContent>La configuration « {{ libelle() }} » n'est pas encore construite dans le prototype.</span>
    </soc-message>
  `,
})
export class ConfigurationAVenirComponent {
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );
  protected readonly libelle = computed(() => ongletDepuisUrl(this.url())?.libelle ?? 'Configuration');
}
