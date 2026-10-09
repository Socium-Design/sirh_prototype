import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SocBreadcrumb, SocPageBreadcrumb, SocPageList, SocPageTabs, SocTabs, type TabItem } from '@socium-design/angular-components';
import { filter, map } from 'rxjs';
import { CONFIGURATION_PATH, ONGLETS_CONFIGURATION, ongletDepuisUrl } from './configuration.tabs';

/**
 * Workspace > Configuration — page à onglets. Chaque onglet est une route enfant affichée dans le `router-outlet` :
 * l'URL porte l'onglet actif (jamais stocké). Les formulaires de création / modification sont des pages plein écran.
 */
@Component({
  selector: 'app-configuration-page',
  imports: [SocPageList, SocPageBreadcrumb, SocPageTabs, SocBreadcrumb, SocTabs, RouterOutlet],
  template: `
    <soc-page-list title="Configurations" description="Paramétrez les éléments partagés du Workspace.">
      <soc-breadcrumb socPageBreadcrumb [items]="breadcrumb()" />
      <soc-tabs socPageTabs [items]="onglets" [value]="actif()?.route ?? ''" (change)="ouvrir($event)" />
      <router-outlet />
    </soc-page-list>
  `,
})
export class ConfigurationPageComponent {
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly onglets: TabItem[] = ONGLETS_CONFIGURATION.map((o) => ({ id: o.route, label: o.libelle }));
  protected readonly actif = computed(() => ongletDepuisUrl(this.url()));
  protected readonly breadcrumb = computed(() => [
    { label: 'Workspace' },
    { label: 'Configurations' },
    ...(this.actif() ? [{ label: this.actif()!.libelle }] : []),
  ]);

  protected ouvrir(route: string): void {
    this.router.navigate([CONFIGURATION_PATH, route]);
  }
}
