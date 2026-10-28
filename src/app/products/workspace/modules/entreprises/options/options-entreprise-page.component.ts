import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { SocBreadcrumb, SocDrawer, SocDrawerDetailItem, SocPageActions, SocPageBreadcrumb, SocPageDetails } from '@socium-design/angular-components';
import { map } from 'rxjs';
import { SocLabsChangesBar, SocLabsPillToggle, type LabsPillOption } from '../../../../../shared/labs/labs';
import type { OptionEntreprise } from '../models/option-entreprise.model';
import { OptionsEntrepriseStore } from './options-entreprise.store';
import { VueCatalogueComponent } from './variantes/vue-catalogue.component';
import { VueListeComponent } from './variantes/vue-liste.component';
import { VueOffreComponent } from './variantes/vue-offre.component';

/** Variantes explorées (`?variante=a|b|liste`, `a` par défaut). */
export type VarianteOptions = 'a' | 'b' | 'liste';

const VARIANTES: LabsPillOption<VarianteOptions>[] = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
  { value: 'liste', label: 'Liste' },
];

const dateFr = (iso: string) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '—');

/**
 * Workspace > Entreprises > {entreprise} > Fonctionnalités et options — remplace la page des « feature flags ». Trois
 * présentations des mêmes données et de la même logique (`OptionsEntrepriseStore`) : A — catalogue (cartes par produit,
 * tuiles), B — l'offre du client d'abord, Liste — première version. Le sélecteur « Variante » sert à les comparer
 * (prototype uniquement). Communs : en-tête, panneau de détail (`soc-drawer`), barre de modifications.
 */
@Component({
  selector: 'app-options-entreprise-page',
  imports: [
    SocPageDetails,
    SocPageBreadcrumb,
    SocPageActions,
    SocBreadcrumb,
    SocDrawer,
    SocDrawerDetailItem,
    SocLabsChangesBar,
    SocLabsPillToggle,
    VueListeComponent,
    VueCatalogueComponent,
    VueOffreComponent,
  ],
  providers: [OptionsEntrepriseStore],
  styleUrl: './options-entreprise-page.component.scss',
  template: `
    <soc-page-details title="Fonctionnalités et options" [topStatusLabel]="store.entreprise()?.nom ?? ''" [description]="store.charge() ? store.resume() : ''">
      <soc-breadcrumb socPageBreadcrumb [items]="breadcrumb()" />
      <div socPageActions class="variante" data-testid="variante">
        <span class="variante__libelle" aria-hidden="true">Variante</span>
        <soc-labs-pill-toggle ariaLabel="Variante (prototype)" size="sm" [options]="variantes" [value]="variante()" (valueChange)="changerVariante($event)" />
      </div>

      <div class="page" [attr.data-variante]="variante()">
        <p class="page__modification" data-testid="derniere-modification">
          Dernière modification par {{ store.derniereModification().par }} le {{ dateFr(store.derniereModification().le) }}
        </p>
        @switch (variante()) {
          @case ('b') {
            <app-options-vue-offre />
          }
          @case ('liste') {
            <app-options-vue-liste />
          }
          @default {
            <app-options-vue-catalogue />
          }
        }
      </div>

      <soc-labs-changes-bar
        [count]="store.nbModifications()"
        [saved]="store.enregistre()"
        [saving]="store.enregistrement()"
        (save)="store.enregistrer()"
        (cancel)="store.annuler()"
      />
    </soc-page-details>

    @if (store.detail(); as d) {
      <soc-drawer [open]="true" [title]="d.libelle" [topline]="store.libelleProduit(d.produit)" (close)="store.fermerDetail()">
        <soc-drawer-detail-item label="Description" [value]="d.description" />
        <soc-drawer-detail-item label="Offre" [value]="store.libelleOffre(d)" />
        <soc-drawer-detail-item label="Produit" [value]="store.libelleProduit(d.produit)" />
        <soc-drawer-detail-item label="État" [value]="store.estActive(d) ? 'Activée' : 'Désactivée'" />
        @if (d.parentId) {
          <soc-drawer-detail-item label="Option parente" [value]="store.libelleOption(d.parentId)" />
        }
        @if (sousOptionsDe(d)) {
          <soc-drawer-detail-item label="Sous-options" [value]="sousOptionsDe(d)" />
        }
        <soc-drawer-detail-item label="Mise en ligne" [value]="dateFr(d.miseEnLigne)" />
      </soc-drawer>
    }
  `,
})
export class OptionsEntreprisePageComponent {
  protected readonly store = inject(OptionsEntrepriseStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly variantes = VARIANTES;
  protected readonly dateFr = dateFr;

  protected readonly variante = toSignal(
    this.route.queryParamMap.pipe(
      map((p) => {
        const v = p.get('variante');
        return v === 'b' || v === 'liste' ? v : 'a';
      }),
    ),
    { initialValue: 'a' as VarianteOptions },
  );

  protected readonly breadcrumb = computed(() => [
    { label: 'Entreprises', onClick: () => this.router.navigateByUrl('/workspace/entreprises') },
    { label: this.store.entreprise()?.nom ?? '…' },
    { label: 'Fonctionnalités et options' },
  ]);

  protected changerVariante(variante: VarianteOptions | null): void {
    if (!variante) return;
    this.router.navigate([], { relativeTo: this.route, queryParams: { variante }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected sousOptionsDe(option: OptionEntreprise): string {
    return this.store
      .sousOptions(option)
      .map((o) => `${o.libelle} (${this.store.estActive(o) ? 'activée' : 'désactivée'})`)
      .join(', ');
  }
}
