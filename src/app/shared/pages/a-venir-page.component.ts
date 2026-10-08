import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  NAVIGATION_PRESETS,
  SocBreadcrumb,
  SocMessage,
  SocMessageContent,
  SocPageBreadcrumb,
  SocPageHome,
  type NavigationProduct,
} from '@socium-design/angular-components';
import { map } from 'rxjs';

/** Page affichée pour tout item de menu ou produit qui n'a pas encore de page dans le prototype. */
@Component({
  selector: 'app-a-venir-page',
  imports: [SocPageHome, SocPageBreadcrumb, SocBreadcrumb, SocMessage, SocMessageContent],
  template: `
    <soc-page-home sectionTitle="Bientôt disponible">
      <soc-breadcrumb socPageBreadcrumb [items]="[{ label: produit() }, { label: libelle() }]" />
      <soc-message variant="banner" status="info">
        <span socMessageContent>La page « {{ libelle() }} » n'est pas encore construite dans le prototype.</span>
      </soc-message>
    </soc-page-home>
  `,
})
export class AVenirPageComponent {
  private readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('id') ?? '')), { initialValue: '' });
  private readonly cle = computed(() => this.id().split('-')[0] as NavigationProduct);
  protected readonly produit = computed(() => NAVIGATION_PRESETS[this.cle()]?.title ?? 'Produit');
  protected readonly libelle = computed(() => {
    const items = NAVIGATION_PRESETS[this.cle()]?.sections.flatMap((s) => s.items) ?? [];
    return items.find((i) => i.id === this.id())?.label ?? this.produit();
  });
}
