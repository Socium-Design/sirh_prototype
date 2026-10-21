import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SocBreadcrumb, SocPageBreadcrumb, SocPageList, SocPageTabs, SocTabs, type TabItem } from '@socium-design/angular-components';
import { filter, map } from 'rxjs';
import { CONFIGURATIONS_PATH, ONGLETS_CONFIGURATIONS, ongletDepuisUrl } from './configurations.tabs';

/**
 * Perfs > Configurations — page à onglets, sur le modèle de Workspace > Configuration : chaque onglet est une route enfant
 * affichée dans le `router-outlet`, l'URL porte l'onglet actif (jamais stocké).
 */
@Component({
  selector: 'app-configurations-page',
  imports: [SocPageList, SocPageBreadcrumb, SocPageTabs, SocBreadcrumb, SocTabs, RouterOutlet],
  template: `
    <soc-page-list
      title="Configurations"
      description="Configurez vos objectifs qualitatifs et ajustez les critères d'appréciation en fonction de vos priorités et de votre contexte métier."
    >
      <soc-breadcrumb socPageBreadcrumb [items]="breadcrumb" (homeClick)="accueil()" />
      <soc-tabs socPageTabs [items]="onglets" [value]="actif()?.route ?? ''" (change)="ouvrir($event)" />
      <router-outlet />
    </soc-page-list>
  `,
})
export class ConfigurationsPageComponent {
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly onglets: TabItem[] = ONGLETS_CONFIGURATIONS.map((o) => ({ id: o.route, label: o.libelle }));
  protected readonly actif = computed(() => ongletDepuisUrl(this.url()));
  /** Comme la prod : icône d'accueil › Configurations. */
  protected readonly breadcrumb = [{ label: 'Configurations' }];

  protected ouvrir(route: string): void {
    this.router.navigate([CONFIGURATIONS_PATH, route]);
  }

  protected accueil(): void {
    this.router.navigateByUrl('/perf');
  }
}
