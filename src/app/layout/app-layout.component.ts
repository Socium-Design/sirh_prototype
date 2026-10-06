import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import {
  SocAppShell,
  SocAppShellHeaderAvatar,
  SocAppShellHeaderLeft,
  SocAvatar,
  SocEnterpriseSelect,
  type AppShellProduct,
} from '@socium-design/angular-components';
import { filter, map, startWith } from 'rxjs';
import { navItemFromUrl, productFromUrl, routeForNavItem, routeForProduct } from '../core/navigation/navigation.map';
import { SessionService } from '../core/session/session.service';

/**
 * Racine de toute page applicative : `soc-app-shell` (AppSwitch + header + menu latéral) autour du `<router-outlet>`.
 * Le produit et l'item de menu actifs sont DÉRIVÉS de l'URL (jamais stockés), et les clics naviguent :
 * l'écran affiché et le menu ne peuvent donc pas diverger. Le mapping item → route vit dans `navigation.map.ts`.
 */
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, SocAppShell, SocAppShellHeaderLeft, SocAppShellHeaderAvatar, SocEnterpriseSelect, SocAvatar],
  template: `
    <soc-app-shell
      [product]="product()"
      (productChange)="router.navigateByUrl(routeForProduct($event))"
      [navSelectedId]="selectedItem()"
      (navSelectedIdChange)="onNavSelect($event)"
      [headerUserName]="session.user().name"
      [user]="session.user()"
      [showViewProfile]="true"
      [languages]="session.languages()"
      [language]="session.language()"
      (languageChange)="session.language.set($event)"
    >
      <soc-enterprise-select
        socAppShellHeaderLeft
        [options]="session.enterprises()"
        [value]="session.enterprise()"
        (valueChange)="session.enterprise.set($event)"
      />
      <soc-avatar socAppShellHeaderAvatar [label]="session.user().avatarLabel" mode="solid" size="md" />
      <router-outlet />
    </soc-app-shell>
  `,
})
export class AppLayoutComponent {
  protected readonly router = inject(Router);
  protected readonly session = inject(SessionService);
  protected readonly routeForProduct = routeForProduct;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly product = computed<AppShellProduct>(() => productFromUrl(this.url()));
  protected readonly selectedItem = computed(() => navItemFromUrl(this.url()));

  protected onNavSelect(id: string | undefined): void {
    if (id) this.router.navigateByUrl(routeForNavItem(id));
  }
}
