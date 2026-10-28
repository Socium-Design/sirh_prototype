import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  SocBadge,
  SocBreadcrumb,
  SocDataTable,
  SocMessage,
  SocMessageContent,
  SocPageBadge,
  SocPageBreadcrumb,
  SocPageList,
  SocSwitch,
  SocTooltip,
  SocTooltipLabel,
  type DataTableCellContext,
  type DataTableColumn,
} from '@socium-design/angular-components';
import { LucideLogIn, LucidePencil, LucidePuzzle } from '@lucide/angular';
import { MODULES_ENTREPRISE } from '../../../../../mocks/data/entreprises.mock';
import { SocLabsIconButton, SocLabsSwitchHiddenLabel, SocLabsTag } from '../../../../shared/labs/labs';
import type { Entreprise } from './models/entreprise.model';
import { EntreprisesService } from './services/entreprises.service';

/**
 * Workspace > Entreprises : entreprises clientes administrées par les CX. Actions de ligne (dans cet ordre) : activer /
 * désactiver l'entreprise, « Fonctionnalités et options » (page des options), « Modifier les informations », « Se
 * connecter à l'entreprise » — chacune nommée (`aria-label` / libellé masqué de l'interrupteur) et doublée d'une
 * info-bulle du kit, jamais d'attribut `title`.
 */
@Component({
  selector: 'app-entreprises-page',
  imports: [
    SocPageList,
    SocPageBreadcrumb,
    SocPageBadge,
    SocBreadcrumb,
    SocBadge,
    SocDataTable,
    SocMessage,
    SocMessageContent,
    SocSwitch,
    SocTooltip,
    SocTooltipLabel,
    SocLabsIconButton,
    SocLabsSwitchHiddenLabel,
    SocLabsTag,
    LucidePuzzle,
    LucidePencil,
    LucideLogIn,
  ],
  styleUrl: './entreprises-page.component.scss',
  template: `
    <ng-template #modulesCell let-row>
      <ul class="modules" aria-label="Modules">
        @for (module of row.modules; track module) {
          <li>
            <soc-labs-tag><span aria-hidden="true">{{ module }}</span><span class="sr-only">{{ libelleModule(module) }}</span></soc-labs-tag>
          </li>
        }
      </ul>
    </ng-template>

    <ng-template #actionsCell let-row>
      <div class="actions" data-testid="actions">
        <soc-tooltip>
          <soc-switch
            socLabsSwitchHiddenLabel
            [label]="libelleActive(row)"
            [checked]="row.active"
            (checkedChange)="basculerActive(row, $event)"
            data-testid="active"
          />
          <span socTooltipLabel>{{ libelleActive(row) }}</span>
        </soc-tooltip>
        <soc-labs-icon-button ariaLabel="Fonctionnalités et options" tooltip="Fonctionnalités et options" (click)="ouvrirOptions(row)" data-testid="options">
          <svg lucidePuzzle class="size-full" [strokeWidth]="1.5"></svg>
        </soc-labs-icon-button>
        <soc-labs-icon-button ariaLabel="Modifier les informations" tooltip="Modifier les informations" (click)="nonDisponible('Modifier les informations', row)" data-testid="modifier">
          <svg lucidePencil class="size-full" [strokeWidth]="1.5"></svg>
        </soc-labs-icon-button>
        <soc-labs-icon-button ariaLabel="Se connecter à l'entreprise" tooltip="Se connecter à l'entreprise" (click)="nonDisponible('Se connecter à l\\'entreprise', row)" data-testid="connexion">
          <svg lucideLogIn class="size-full" [strokeWidth]="1.5"></svg>
        </soc-labs-icon-button>
      </div>
    </ng-template>

    <soc-page-list title="Entreprises" description="Entreprises clientes : activation, fonctionnalités et options.">
      <soc-breadcrumb socPageBreadcrumb [items]="[{ label: 'Workspace' }, { label: 'Entreprises' }]" />
      <soc-badge socPageBadge color="primary">{{ total() }}</soc-badge>

      @if (information(); as info) {
        <soc-message variant="inline" status="info" data-testid="information">
          <span socMessageContent>{{ info }}</span>
        </soc-message>
      }

      <soc-data-table
        [columns]="columns()"
        [rows]="pageRows()"
        [rowKey]="rowKey"
        [searchable]="true"
        (search)="onSearch($event)"
        [pagination]="pagination()"
        (pageChange)="page.set($event)"
        (pageSizeChange)="onPageSize($event)"
      />
    </soc-page-list>
  `,
})
export class EntreprisesPageComponent {
  private readonly service = inject(EntreprisesService);
  private readonly router = inject(Router);
  private readonly chargees = toSignal(this.service.getAll(), { initialValue: [] as Entreprise[] });
  /** Activations modifiées depuis la liste (la liste chargée reste la source des autres colonnes). */
  private readonly activations = signal<Record<string, boolean>>({});
  private readonly modulesCell = viewChild.required<TemplateRef<DataTableCellContext<Entreprise>>>('modulesCell');
  private readonly actionsCell = viewChild.required<TemplateRef<DataTableCellContext<Entreprise>>>('actionsCell');

  protected readonly rowKey = (e: Entreprise) => e.id;
  protected readonly query = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly information = signal<string | null>(null);

  private readonly entreprises = computed(() =>
    this.chargees().map((e) => ({ ...e, active: this.activations()[e.id] ?? e.active })),
  );

  protected readonly columns = computed<DataTableColumn<Entreprise>[]>(() => [
    { key: 'nom', header: 'Nom', render: (e) => e.nom },
    { key: 'pays', header: 'Pays convention', render: (e) => e.paysConvention },
    { key: 'modules', header: 'Modules', render: this.modulesCell() },
    { key: 'forme', header: 'Forme juridique', render: (e) => e.formeJuridique },
    { key: 'creeLe', header: 'Créé le', render: (e) => new Date(e.creeLe).toLocaleDateString('fr-FR') },
    { key: 'actions', header: 'Actions', render: this.actionsCell() },
  ]);

  private readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.entreprises();
    return this.entreprises().filter((e) => [e.nom, e.paysConvention, e.formeJuridique].some((v) => v.toLowerCase().includes(q)));
  });

  protected readonly total = computed(() => this.entreprises().length);
  protected readonly pageRows = computed(() => this.filtered().slice((this.page() - 1) * this.pageSize(), this.page() * this.pageSize()));
  protected readonly pagination = computed(() => ({
    currentPage: this.page(),
    totalPages: Math.max(1, Math.ceil(this.filtered().length / this.pageSize())),
    totalEntries: this.filtered().length,
    pageSize: this.pageSize(),
  }));

  protected libelleModule(module: Entreprise['modules'][number]): string {
    return MODULES_ENTREPRISE[module];
  }

  protected libelleActive(e: Entreprise): string {
    return e.active ? 'Entreprise active' : 'Entreprise désactivée';
  }

  protected basculerActive(e: Entreprise, active: boolean): void {
    this.service.setActive(e.id, active);
    this.activations.update((a) => ({ ...a, [e.id]: active }));
  }

  protected ouvrirOptions(e: Entreprise): void {
    this.router.navigate(['/workspace/entreprises', e.id, 'options']);
  }

  /** « Modifier les informations » et « Se connecter à l'entreprise » n'ont pas encore de page dans le prototype. */
  protected nonDisponible(action: string, e: Entreprise): void {
    this.information.set(`« ${action} » (${e.nom}) n'est pas encore construit dans le prototype.`);
  }

  protected onSearch(query: string): void {
    this.query.set(query);
    this.page.set(1);
  }

  protected onPageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }
}
