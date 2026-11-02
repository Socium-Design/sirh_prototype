import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import {
  SocAccordion,
  SocButton,
  SocButtonLeftIcon,
  SocDataTable,
  SocDataTableActions,
  SocDataTableFilters,
  SocDialog,
  SocMessage,
  SocMessageContent,
  SocPageActions,
  SocPageDetails,
  SocPageTag,
  SocTableFilterSelect,
  SocTooltip,
  SocTooltipLabel,
  type DataTableCellContext,
  type DataTableColumn,
  type DialogAction,
} from '@socium-design/angular-components';
import { LucideCircleX, LucidePencil, LucidePlus, LucideTrash } from '@lucide/angular';
import { DATE_DONNEES } from '../../../../../mocks/data/employes.mock';
import { SocLabsProgressRing, SocLabsTag, SocLabsTimeline, type LabsTimelineEvent, type LabsTimelineLegendItem } from '../../../../shared/labs/labs';
import { MiseAJourDialogComponent } from './components/mise-a-jour-dialog.component';
import type { Objectif, StatutObjectif } from './models/objectif.model';
import { COULEUR_STATUT, EVENEMENTS, OBJECTIFS_PATH } from './objectifs.libelles';
import { formatDateHeure, formatPeriode, progressionObjectif, statutObjectif } from './services/objectifs-regles';
import { ObjectifsService } from './services/objectifs.service';
import { OrganisationService } from './services/organisation.service';

const TAILLE_PAGE = 4;

interface Info {
  titre: string;
  assigne: string;
  periode: string;
  progression: string;
  ponderation: string;
}

interface LigneSousObjectif {
  objectif: Objectif;
  assigne: string;
  statut: StatutObjectif;
  progression: number;
}

/** Perfs > Objectifs > détail : informations générales, sous-objectifs et historique, chaque section repliable. */
@Component({
  selector: 'app-objectif-detail-page',
  imports: [
    RouterLink, SocPageDetails, SocPageTag, SocPageActions, SocAccordion, SocButton, SocButtonLeftIcon, SocTooltip, SocTooltipLabel, SocDataTable,
    SocDataTableFilters, SocDataTableActions, SocTableFilterSelect, SocDialog, SocMessage, SocMessageContent, SocLabsTag, SocLabsProgressRing,
    SocLabsTimeline, MiseAJourDialogComponent, LucidePencil, LucideCircleX, LucideTrash, LucidePlus,
  ],
  styleUrl: './objectif-detail-page.component.scss',
  template: `
    <ng-template #titreCell let-row>
      <a class="lien" [routerLink]="[chemin, row.objectif.id]">{{ row.objectif.titre }}</a>
    </ng-template>
    <ng-template #statutCell let-row><soc-labs-tag [color]="couleurStatut[row.statut]">{{ row.statut }}</soc-labs-tag></ng-template>
    <ng-template #progressionCell let-row>
      <soc-labs-progress-ring [value]="row.progression" [status]="row.progression > 100 ? 'information' : 'success'" [label]="'Progression de ' + row.objectif.titre" />
    </ng-template>
    <ng-template #actionCell let-row>
      @if (row.objectif.etat === 'actif') {
        <button socButton variant="tertiary" size="sm" type="button" (click)="aMettreAJour.set(row.objectif)" [attr.aria-label]="'Mettre à jour ' + row.objectif.titre">
          Mettre à jour
        </button>
      }
    </ng-template>

    @if (objectif(); as o) {
      <soc-page-details [title]="o.titre" [showBack]="true" (back)="retour()">
        <soc-labs-tag socPageTag [color]="couleurStatut[statut()!]" data-testid="statut">{{ statut() }}</soc-labs-tag>
        <soc-tooltip socPageActions position="bottom">
          <button socButton variant="tertiary" size="lg" type="button" aria-label="Modifier" data-testid="modifier" (click)="modifier()">
            <svg lucidePencil socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
          </button>
          <span socTooltipLabel>Modifier</span>
        </soc-tooltip>
        @if (o.etat !== 'cloture') {
          <soc-tooltip socPageActions position="bottom">
            <button socButton variant="tertiary" size="lg" type="button" aria-label="Clôturer" data-testid="cloturer" (click)="confirmation.set('cloture')">
              <svg lucideCircleX socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
            </button>
            <span socTooltipLabel>Clôturer</span>
          </soc-tooltip>
        }
        <soc-tooltip socPageActions position="bottom">
          <button socButton variant="tertiary" size="lg" type="button" aria-label="Supprimer" data-testid="supprimer" (click)="confirmation.set('suppression')">
            <svg lucideTrash socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
          </button>
          <span socTooltipLabel>Supprimer</span>
        </soc-tooltip>
        @if (peutMettreAJour()) {
          <button socButton socPageActions size="lg" type="button" data-testid="mettre-a-jour" (click)="aMettreAJour.set(o)">Mettre à jour l'objectif</button>
        }

        <div class="sections">
          @if (message(); as m) {
            <soc-message variant="inline" status="success" data-testid="message">
              <span socMessageContent>{{ m }}</span>
            </soc-message>
          }

          <soc-accordion label="Informations générales" [(open)]="infosOuvertes" data-testid="section-infos">
            <soc-data-table mode="detail" [columns]="colonnesInfos" [rows]="[infos()!]" [rowKey]="cleInfos" />
          </soc-accordion>

          <soc-accordion label="Sous objectifs" [(open)]="sousOuverts" data-testid="section-sous">
            <soc-data-table
              [columns]="colonnesSous()"
              [rows]="pageSous()"
              [rowKey]="cleSous"
              [searchable]="true"
              (search)="rechercheSous.set($event); pageSousCourante.set(1)"
              [pagination]="paginationSous()"
              (pageChange)="pageSousCourante.set($event)"
            >
              <soc-table-filter-select socDataTableFilters label="Statut" [options]="optionsStatut" [value]="statutSous()" (valueChange)="statutSous.set($event ?? ''); pageSousCourante.set(1)" />
              <button socButton socDataTableActions size="lg" type="button" (click)="ajouterSousObjectif()">
                <svg lucidePlus socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
                Ajouter un sous objectif
              </button>
            </soc-data-table>
            @if (sousFiltres().length === 0) {
              <p class="vide" data-testid="sous-vide">{{ sousObjectifs().length === 0 ? 'Aucun sous objectif ajouté' : 'Aucun sous objectif ne correspond à votre recherche.' }}</p>
            }
          </soc-accordion>

          <soc-accordion label="Historiques" [(open)]="historiqueOuvert" data-testid="section-historique">
            <soc-labs-timeline [events]="evenements()" [legend]="legende" emptyText="Aucun historique." />
          </soc-accordion>
        </div>
      </soc-page-details>

      <app-mise-a-jour-dialog [objectif]="aMettreAJour()" (misAJour)="mettreAJour($event)" (ferme)="aMettreAJour.set(null)" />
      <soc-dialog
        [open]="confirmation() !== null"
        [title]="confirmation() === 'cloture' ? 'Clôturer l\\'objectif ?' : 'Supprimer l\\'objectif ?'"
        [primaryAction]="confirmer"
        [secondaryAction]="annuler"
        (close)="confirmation.set(null)"
      >
        <p>
          @if (confirmation() === 'cloture') {
            « {{ o.titre }} » passera dans l'onglet « Clôturés ».
          } @else {
            « {{ o.titre }} » et ses sous-objectifs seront supprimés.
          }
        </p>
      </soc-dialog>
    } @else {
      <soc-page-details title="Objectif introuvable" [showBack]="true" (back)="retour()">
        <soc-message variant="banner" status="warning" title="Objectif introuvable">
          <span socMessageContent>Cet objectif n'existe pas ou a été supprimé.</span>
        </soc-message>
      </soc-page-details>
    }
  `,
})
export class ObjectifDetailPageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  /** Paramètre `:id`, suivi : un lien vers un sous-objectif réutilise la même page. */
  protected readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), { initialValue: this.route.snapshot.paramMap.get('id') ?? '' });
  private readonly service = inject(ObjectifsService);
  private readonly organisation = inject(OrganisationService);

  private readonly titreCell = viewChild<TemplateRef<DataTableCellContext<LigneSousObjectif>>>('titreCell');
  private readonly statutCell = viewChild<TemplateRef<DataTableCellContext<LigneSousObjectif>>>('statutCell');
  private readonly progressionCell = viewChild<TemplateRef<DataTableCellContext<LigneSousObjectif>>>('progressionCell');
  private readonly actionCell = viewChild<TemplateRef<DataTableCellContext<LigneSousObjectif>>>('actionCell');

  protected readonly chemin = OBJECTIFS_PATH;
  protected readonly couleurStatut = COULEUR_STATUT;
  protected readonly message = signal(this.service.consommerMessage());
  protected readonly infosOuvertes = signal(true);
  protected readonly sousOuverts = signal(true);
  protected readonly historiqueOuvert = signal(true);
  protected readonly aMettreAJour = signal<Objectif | null>(null);
  protected readonly confirmation = signal<'cloture' | 'suppression' | null>(null);
  protected readonly rechercheSous = signal('');
  protected readonly statutSous = signal('');
  protected readonly pageSousCourante = signal(1);

  protected readonly legende: LabsTimelineLegendItem[] = [
    { tone: 'success', label: 'Modification', description: 'changement des informations' },
    { tone: 'information', label: 'Mise à jour', description: 'changement de la progression' },
  ];
  protected readonly optionsStatut = [
    { value: '', label: 'Tous les statuts' },
    ...(['En cours', 'Passé', 'À venir'] as StatutObjectif[]).map((s) => ({ value: s, label: s })),
  ];

  protected readonly objectif = computed(() => this.service.objectif(this.id()));
  protected readonly sousObjectifs = computed(() => (this.objectif() ? this.service.sousObjectifs(this.id()) : []));
  protected readonly statut = computed(() => (this.objectif() ? statutObjectif(this.objectif()!, DATE_DONNEES) : null));
  protected readonly peutMettreAJour = computed(() => this.objectif()?.etat === 'actif' && this.sousObjectifs().length === 0);

  protected readonly cleInfos = (i: Info) => i.titre;
  protected readonly colonnesInfos: DataTableColumn<Info>[] = [
    { key: 'titre', header: 'Titre', render: (i) => i.titre },
    { key: 'assigne', header: 'Assigné à', render: (i) => i.assigne },
    { key: 'periode', header: 'Période', render: (i) => i.periode },
    { key: 'progression', header: 'Progression', render: (i) => i.progression },
    { key: 'ponderation', header: 'Pondération', render: (i) => i.ponderation },
  ];
  protected readonly infos = computed<Info | null>(() => {
    const o = this.objectif();
    if (!o) return null;
    const progression = progressionObjectif(o, this.sousObjectifs());
    return {
      titre: o.titre,
      assigne: this.nom(o.employeId),
      periode: formatPeriode(o.debut, o.fin),
      progression: `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(progression)} %`,
      ponderation: String(o.ponderation),
    };
  });

  protected readonly cleSous = (l: LigneSousObjectif) => l.objectif.id;
  protected readonly colonnesSous = computed<DataTableColumn<LigneSousObjectif>[]>(() => [
    { key: 'objectif', header: 'Objectif', render: this.titreCell() ?? ((l) => l.objectif.titre) },
    { key: 'assigne', header: 'Assigné à', render: (l) => l.assigne },
    { key: 'periode', header: 'Période', render: (l) => formatPeriode(l.objectif.debut, l.objectif.fin) },
    { key: 'statut', header: 'Statut', render: this.statutCell() ?? ((l) => l.statut) },
    { key: 'ponderation', header: 'Pondération', render: (l) => String(l.objectif.ponderation) },
    { key: 'progression', header: 'Progression', render: this.progressionCell() ?? ((l) => `${l.progression} %`) },
    { key: 'action', header: 'Action', render: this.actionCell() ?? (() => '') },
  ]);
  protected readonly sousFiltres = computed(() => {
    const q = this.rechercheSous().trim().toLowerCase();
    return this.sousObjectifs()
      .map<LigneSousObjectif>((o) => ({ objectif: o, assigne: this.nom(o.employeId), statut: statutObjectif(o, DATE_DONNEES), progression: progressionObjectif(o) }))
      .filter((l) => !q || l.objectif.titre.toLowerCase().includes(q) || l.assigne.toLowerCase().includes(q))
      .filter((l) => !this.statutSous() || l.statut === this.statutSous());
  });
  protected readonly pageSous = computed(() => this.sousFiltres().slice((this.pageSousCourante() - 1) * TAILLE_PAGE, this.pageSousCourante() * TAILLE_PAGE));
  protected readonly paginationSous = computed(() => ({
    currentPage: this.pageSousCourante(),
    totalPages: Math.max(1, Math.ceil(this.sousFiltres().length / TAILLE_PAGE)),
    totalEntries: this.sousFiltres().length,
    pageSize: TAILLE_PAGE,
  }));

  protected readonly evenements = computed<LabsTimelineEvent[]>(() =>
    (this.objectif()?.historique ?? []).map((e) => ({
      id: e.id,
      label: EVENEMENTS[e.type].libelle,
      tone: EVENEMENTS[e.type].ton,
      date: formatDateHeure(e.le),
      author: e.par,
      role: e.role,
      reason: e.motif,
      details: e.details?.map((d) => ({ label: d.libelle, value: d.valeur })),
    })),
  );

  protected retour(): void {
    this.router.navigateByUrl(OBJECTIFS_PATH);
  }

  protected modifier(): void {
    this.router.navigate([OBJECTIFS_PATH, this.id(), 'modifier']);
  }

  protected ajouterSousObjectif(): void {
    this.router.navigate([OBJECTIFS_PATH, 'nouveau'], { queryParams: { parent: this.id() } });
  }

  protected mettreAJour(valeur: number): void {
    const objectif = this.aMettreAJour();
    if (!objectif) return;
    this.service.mettreAJour(objectif.id, valeur);
    this.aMettreAJour.set(null);
    this.message.set(`« ${objectif.titre} » mis à jour.`);
  }

  protected readonly confirmer: DialogAction = {
    label: 'Confirmer',
    onClick: () => {
      const o = this.objectif();
      if (!o) return;
      if (this.confirmation() === 'cloture') {
        this.service.cloturer(o.id);
        this.confirmation.set(null);
        this.message.set(`« ${o.titre} » est clôturé.`);
      } else {
        this.service.supprimer(o.id);
        this.confirmation.set(null);
        this.service.annoncer(`« ${o.titre} » supprimé.`);
        this.retour();
      }
    },
  };
  protected readonly annuler: DialogAction = { label: 'Annuler', onClick: () => this.confirmation.set(null) };

  private nom(employeId: string): string {
    return this.organisation.collaborateur(employeId)?.nomComplet ?? '—';
  }
}
