import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  SocAvatar,
  SocBadge,
  SocBreadcrumb,
  SocButton,
  SocButtonLeftIcon,
  SocDialog,
  SocInputText,
  SocMenu,
  SocMenuItem,
  SocMenuItemIcon,
  SocMessage,
  SocMessageContent,
  SocPageActions,
  SocPageBadge,
  SocPageBreadcrumb,
  SocPageList,
  SocPageSecondaryTabs,
  SocPageTabs,
  SocPagination,
  SocPopover,
  SocPopoverTrigger,
  SocSearchBar,
  SocTableFilterSelect,
  SocTabs,
  type DialogAction,
  type TabItem,
} from '@socium-design/angular-components';
import { LucideChevronsDownUp, LucideChevronsUpDown, LucideEllipsisVertical, LucideEye, LucideInfo, LucidePencil, LucidePlus, LucideTrash } from '@lucide/angular';
import { DATE_DONNEES } from '../../../../../mocks/data/employes.mock';
import {
  SocLabsGroupedTable,
  SocLabsIconButton,
  SocLabsProgressRing,
  SocLabsTag,
  type LabsGroupedTableCellContext,
  type LabsGroupedTableColumn,
  type LabsGroupedTableGroup,
  type LabsGroupedTableGroupContext,
} from '../../../../shared/labs/labs';
import { MiseAJourDialogComponent } from './components/mise-a-jour-dialog.component';
import type { EtatObjectif, Objectif, StatutObjectif } from './models/objectif.model';
import type { Collaborateur } from './models/organisation.model';
import {
  AIDE_RECURSIF,
  COULEUR_STATUT,
  OBJECTIFS_PATH,
  ONGLETS_ETAT,
  PERIODES,
  VUES_COLLABORATEURS,
  type VueCollaborateurs,
} from './objectifs.libelles';
import { equipe, formatPeriode, progressionObjectif, sousStructures, statutObjectif } from './services/objectifs-regles';
import { ObjectifsService } from './services/objectifs.service';
import { OrganisationService } from './services/organisation.service';

const TAILLE_PAGE = 10;

/** Ligne du tableau : l'objectif et ce qui se calcule une fois (statut, progression, sous-objectifs). */
interface LigneObjectif {
  objectif: Objectif;
  statut: StatutObjectif;
  progression: number;
  aSousObjectifs: boolean;
}

/**
 * Perfs > Objectifs — liste groupée par collaborateur (structure de la prod : onglets de premier niveau, onglets de
 * statut, barre de filtres, tableau groupé repliable). Seuls les collaborateurs du périmètre de l'utilisateur apparaissent.
 */
@Component({
  selector: 'app-objectifs-page',
  imports: [
    RouterLink, SocPageList, SocPageBreadcrumb, SocPageBadge, SocPageActions, SocPageTabs, SocPageSecondaryTabs, SocBreadcrumb, SocBadge,
    SocButton, SocButtonLeftIcon, SocTabs, SocSearchBar, SocTableFilterSelect, SocInputText, SocAvatar, SocPagination, SocMessage,
    SocMessageContent, SocPopover, SocPopoverTrigger, SocMenu, SocMenuItem, SocMenuItemIcon, SocDialog, SocLabsGroupedTable, SocLabsProgressRing,
    SocLabsTag, SocLabsIconButton, MiseAJourDialogComponent, LucidePlus, LucideChevronsUpDown, LucideChevronsDownUp, LucideEllipsisVertical,
    LucideEye, LucidePencil, LucideTrash, LucideInfo,
  ],
  styleUrl: './objectifs-page.component.scss',
  template: `
    <ng-template #groupe let-c let-rows="rows">
      <div class="groupe">
        <soc-avatar size="sm" [label]="c.initiales" [name]="c.nomComplet" [subtitle]="c.matricule" />
        <span class="groupe__total" data-testid="total-groupe">{{ totalParCollaborateur().get(c.id) ?? 0 }} objectif(s) au total</span>
        <button socButton variant="tertiary" size="sm" type="button" (click)="creer(c.id)" [attr.aria-label]="'Créer un objectif pour ' + c.nomComplet">
          <svg lucidePlus socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
          Créer un objectif
        </button>
      </div>
    </ng-template>

    <ng-template #titre let-ligne>
      <a class="objectif__titre" [routerLink]="[chemin, ligne.objectif.id]" data-testid="titre-objectif">{{ ligne.objectif.titre }}</a>
      <span class="objectif__type">{{ ligne.objectif.type }}</span>
    </ng-template>
    <ng-template #statut let-ligne><soc-labs-tag [color]="couleurStatut[ligne.statut]">{{ ligne.statut }}</soc-labs-tag></ng-template>
    <ng-template #progression let-ligne>
      <soc-labs-progress-ring
        [value]="ligne.progression"
        [status]="ligne.progression > 100 ? 'information' : 'success'"
        [label]="'Progression de ' + ligne.objectif.titre"
      />
    </ng-template>
    <ng-template #origine let-ligne><soc-labs-tag>{{ ligne.objectif.origine }}</soc-labs-tag></ng-template>
    <ng-template #action let-ligne>
      <div class="objectif__actions">
        @if (!ligne.aSousObjectifs && ligne.objectif.etat === 'actif') {
          <button socButton variant="tertiary" size="sm" type="button" (click)="aMettreAJour.set(ligne.objectif)" [attr.aria-label]="'Mettre à jour ' + ligne.objectif.titre">
            Mettre à jour
          </button>
        }
        <soc-popover position="bottom-end" [open]="menuOuvert() === ligne.objectif.id" (openChange)="menuOuvert.set($event ? ligne.objectif.id : null)">
          <soc-labs-icon-button socPopoverTrigger [ariaLabel]="'Actions de ' + ligne.objectif.titre" tooltip="Actions">
            <svg lucideEllipsisVertical class="size-full"></svg>
          </soc-labs-icon-button>
          <soc-menu>
            <button socMenuItem label="Voir le détail" (click)="ouvrir(ligne.objectif.id)">
              <svg lucideEye socMenuItemIcon class="size-full" [strokeWidth]="1.5"></svg>
            </button>
            <button socMenuItem label="Modifier" (click)="modifier(ligne.objectif.id)">
              <svg lucidePencil socMenuItemIcon class="size-full" [strokeWidth]="1.5"></svg>
            </button>
            <button socMenuItem label="Supprimer" (click)="demanderSuppression(ligne.objectif)">
              <svg lucideTrash socMenuItemIcon class="size-full" [strokeWidth]="1.5"></svg>
            </button>
          </soc-menu>
        </soc-popover>
      </div>
    </ng-template>

    <soc-page-list title="Objectifs">
      <soc-breadcrumb socPageBreadcrumb [items]="[{ label: 'Objectifs' }]" (homeClick)="router.navigateByUrl('/perf')" />
      <soc-tabs socPageSecondaryTabs variant="pill" [items]="ongletsPremierNiveau" [value]="premierNiveau()" (change)="premierNiveau.set($event)" />
      <soc-badge socPageBadge color="primary" data-testid="total">{{ total() }}</soc-badge>
      <button socButton socPageActions size="lg" type="button" (click)="creer()">
        <svg lucidePlus socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
        Créer un objectif
      </button>
      @if (premierNiveau() === 'objectifs') {
        <soc-tabs socPageTabs [items]="ongletsEtat()" [value]="etat()" (change)="changerEtat($event)" />
      }

      @if (premierNiveau() !== 'objectifs') {
        <soc-message variant="banner" status="info" title="Bientôt disponible" data-testid="bientot">
          <span socMessageContent>« {{ libellePremierNiveau() }} » n'est pas encore construit dans le prototype.</span>
        </soc-message>
      } @else {
        @if (message(); as m) {
          <soc-message variant="inline" status="success" data-testid="message">
            <span socMessageContent>{{ m }}</span>
          </soc-message>
        }

        <div class="barre" role="search" aria-label="Filtrer les objectifs">
          <soc-search-bar class="barre__recherche" placeholder="Rechercher un collaborateur" [value]="recherche()" (valueChange)="filtrer(recherche, $event)" data-testid="recherche" />
          <div class="barre__filtres">
            <span class="barre__filtre"><soc-table-filter-select label="Statut" [options]="optionsStatut" [value]="statutFiltre()" (valueChange)="filtrer(statutFiltre, $event ?? '')" data-testid="filtre-statut" /></span>
            <span class="barre__filtre"><soc-table-filter-select label="Structure" [options]="optionsStructure()" [value]="structureFiltre()" (valueChange)="filtrer(structureFiltre, $event ?? '')" data-testid="filtre-structure" /></span>
            <span class="barre__filtre"><soc-table-filter-select label="Période" [options]="optionsPeriode" [value]="periodeFiltre()" (valueChange)="choisirPeriode($event ?? '')" data-testid="filtre-periode" /></span>
            <span class="barre__ou" aria-hidden="true">ou</span>
            <span class="barre__filtre"><soc-input-text type="date" placeholder="Préciser une période" [inputAttrs]="{ 'aria-label': 'Ou préciser une date de la période' }" [value]="dateFiltre()" (valueChange)="choisirDate($event)" data-testid="filtre-date" /></span>
            <div class="barre__vue">
              <soc-table-filter-select label="Collaborateurs" [options]="vues" [value]="vue()" (valueChange)="filtrer(vue, $any($event ?? 'tous'))" data-testid="filtre-vue" />
              <soc-labs-icon-button [ariaLabel]="aideRecursif" [tooltip]="aideRecursif">
                <svg lucideInfo class="size-full"></svg>
              </soc-labs-icon-button>
            </div>
            <button socButton variant="secondary" size="sm" type="button" (click)="basculerTout()" data-testid="tout-deplier">
              @if (toutDeplie()) {
                <svg lucideChevronsDownUp socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
              } @else {
                <svg lucideChevronsUpDown socButtonLeftIcon class="size-full" [strokeWidth]="1.5"></svg>
              }
              {{ toutDeplie() ? 'Tout replier' : 'Tout déplier' }}
            </button>
            <span class="barre__filtre"><soc-table-filter-select label="Filiale" [options]="optionsFiliale()" [value]="filialeFiltre()" (valueChange)="filtrer(filialeFiltre, $event ?? '')" data-testid="filtre-filiale" /></span>
          </div>
        </div>

        <soc-labs-grouped-table
          caption="Objectifs groupés par collaborateur"
          [columns]="colonnes()"
          [groups]="groupesPage()"
          [rowKey]="cleLigne"
          [childRows]="sousLignes"
          [groupHeader]="groupe"
          [groupLabel]="nomGroupe"
          [rowLabel]="nomLigne"
          emptyText="Aucun résultat ne correspond à votre recherche."
          [(expandedGroups)]="groupesOuverts"
          [(expandedRows)]="lignesOuvertes"
        />

        <div class="pied">
          <span data-testid="resume-pagination">{{ resumePagination() }}</span>
          @if (groupes().length > 0) {
            <soc-pagination [currentPage]="page()" [totalPages]="totalPages()" (pageChange)="page.set($event)" />
          }
        </div>
      }
    </soc-page-list>

    <app-mise-a-jour-dialog [objectif]="aMettreAJour()" (misAJour)="mettreAJour($event)" (ferme)="aMettreAJour.set(null)" />
    <soc-dialog
      [open]="!!aSupprimer()"
      title="Supprimer l'objectif ?"
      [primaryAction]="confirmerSuppression"
      [secondaryAction]="annulerSuppression"
      (close)="aSupprimer.set(null)"
    >
      <p>« {{ aSupprimer()?.titre }} » et ses sous-objectifs seront supprimés.</p>
    </soc-dialog>
  `,
})
export class ObjectifsPageComponent {
  protected readonly router = inject(Router);
  private readonly service = inject(ObjectifsService);
  private readonly organisation = inject(OrganisationService);

  private readonly titre = viewChild.required<TemplateRef<LabsGroupedTableCellContext<LigneObjectif>>>('titre');
  private readonly statut = viewChild.required<TemplateRef<LabsGroupedTableCellContext<LigneObjectif>>>('statut');
  private readonly progression = viewChild.required<TemplateRef<LabsGroupedTableCellContext<LigneObjectif>>>('progression');
  private readonly origine = viewChild.required<TemplateRef<LabsGroupedTableCellContext<LigneObjectif>>>('origine');
  private readonly action = viewChild.required<TemplateRef<LabsGroupedTableCellContext<LigneObjectif>>>('action');
  protected readonly groupe = viewChild.required<TemplateRef<LabsGroupedTableGroupContext<Collaborateur, LigneObjectif>>>('groupe');

  protected readonly chemin = OBJECTIFS_PATH;
  protected readonly couleurStatut = COULEUR_STATUT;
  protected readonly aideRecursif = AIDE_RECURSIF;
  protected readonly vues = VUES_COLLABORATEURS;
  protected readonly message = signal(this.service.consommerMessage());

  protected readonly ongletsPremierNiveau: TabItem[] = [
    { id: 'objectifs', label: 'Objectifs' },
    { id: 'plans', label: 'Plans stratégiques' },
    { id: 'contrats', label: "Contrats d'objectifs" },
  ];
  protected readonly premierNiveau = signal('objectifs');
  protected readonly libellePremierNiveau = computed(() => this.ongletsPremierNiveau.find((o) => o.id === this.premierNiveau())!.label);

  protected readonly etat = signal<EtatObjectif>('actif');
  protected readonly recherche = signal('');
  protected readonly statutFiltre = signal('');
  protected readonly structureFiltre = signal('');
  protected readonly periodeFiltre = signal('');
  protected readonly dateFiltre = signal('');
  protected readonly vue = signal<VueCollaborateurs>('tous');
  protected readonly filialeFiltre = signal('');
  protected readonly page = signal(1);

  protected readonly groupesOuverts = signal(new Set(this.organisation.collaborateurs().map((c) => c.id)));
  protected readonly lignesOuvertes = signal(new Set<string>());
  protected readonly menuOuvert = signal<string | null>(null);
  protected readonly aMettreAJour = signal<Objectif | null>(null);
  protected readonly aSupprimer = signal<Objectif | null>(null);

  protected readonly optionsStatut = [
    { value: '', label: 'Tous les statuts' },
    ...(['En cours', 'Passé', 'À venir'] as StatutObjectif[]).map((s) => ({ value: s, label: s })),
  ];
  protected readonly optionsPeriode = [{ value: '', label: 'Toutes les périodes' }, ...PERIODES.map((p) => ({ value: p.id, label: p.libelle }))];
  protected readonly optionsStructure = computed(() => [
    { value: '', label: 'Toutes les structures' },
    ...this.organisation
      .structures()
      .filter((s) => this.organisation.collaborateurs().some((c) => sousStructures(this.organisation.structures(), s.id).has(c.structureId)))
      .map((s) => ({ value: s.id, label: s.parentId ? `— ${s.nom}` : s.nom })),
  ]);
  protected readonly optionsFiliale = computed(() => [
    { value: '', label: 'Toutes les filiales' },
    ...[...new Set(this.organisation.collaborateurs().map((c) => c.filiale))].sort().map((f) => ({ value: f, label: f })),
  ]);

  protected readonly cleLigne = (l: LigneObjectif) => l.objectif.id;
  protected readonly nomGroupe = (c: Collaborateur) => `les objectifs de ${c.nomComplet}`;
  protected readonly nomLigne = (l: LigneObjectif) => l.objectif.titre;
  protected readonly sousLignes = (l: LigneObjectif) => this.service.sousObjectifs(l.objectif.id).map((o) => this.ligne(o));

  protected readonly colonnes = computed<LabsGroupedTableColumn<LigneObjectif>[]>(() => [
    { key: 'objectif', header: 'Objectif', render: this.titre(), width: '28%' },
    { key: 'periode', header: 'Période', render: (l) => formatPeriode(l.objectif.debut, l.objectif.fin) },
    { key: 'statut', header: 'Statut', render: this.statut() },
    { key: 'ponderation', header: 'Pondération', render: (l) => String(l.objectif.ponderation) },
    { key: 'progression', header: 'Progression', render: this.progression() },
    { key: 'origine', header: 'Origine', render: this.origine() },
    { key: 'action', header: 'Action', render: this.action() },
  ]);

  /** Objectifs de premier niveau des collaborateurs du périmètre. */
  private readonly objectifsPerimetre = computed(() => {
    const ids = new Set(this.organisation.collaborateurs().map((c) => c.id));
    return this.service.objectifs().filter((o) => !o.parentId && ids.has(o.employeId));
  });

  protected readonly ongletsEtat = computed<TabItem[]>(() =>
    ONGLETS_ETAT.map((o) => ({ id: o.id, label: `${o.libelle} (${this.objectifsPerimetre().filter((x) => x.etat === o.id).length})` })),
  );
  /** Comme la prod : le total du titre compte les objectifs actifs et clôturés. */
  protected readonly total = computed(() => this.objectifsPerimetre().filter((o) => o.etat === 'actif' || o.etat === 'cloture').length);

  private readonly objectifsOnglet = computed(() => this.objectifsPerimetre().filter((o) => o.etat === this.etat()));

  protected readonly totalParCollaborateur = computed(() => {
    const totaux = new Map<string, number>();
    for (const o of this.objectifsOnglet()) totaux.set(o.employeId, (totaux.get(o.employeId) ?? 0) + 1);
    return totaux;
  });

  /** Collaborateurs retenus par la recherche, la structure, la filiale et le sélecteur « Tous les collaborateurs ». */
  private readonly collaborateursFiltres = computed(() => {
    const tous = this.organisation.collaborateurs();
    const moi = this.organisation.utilisateurId();
    let liste: Collaborateur[];
    switch (this.vue()) {
      case 'recursif':
        liste = equipe(tous, moi, true);
        break;
      case 'n1':
        liste = equipe(tous, moi, false);
        break;
      case 'mes':
        liste = tous.filter((c) => c.id === moi);
        break;
      default:
        liste = tous;
    }
    const q = this.recherche().trim().toLowerCase();
    const structures = this.structureFiltre() ? sousStructures(this.organisation.structures(), this.structureFiltre()) : null;
    return liste
      .filter((c) => !q || c.nomComplet.toLowerCase().includes(q) || c.matricule.toLowerCase().includes(q))
      .filter((c) => !structures || structures.has(c.structureId))
      .filter((c) => !this.filialeFiltre() || c.filiale === this.filialeFiltre())
      .sort((a, b) => a.nomComplet.localeCompare(b.nomComplet, 'fr'));
  });

  private readonly objectifsFiltres = computed(() => {
    const periode = PERIODES.find((p) => p.id === this.periodeFiltre());
    const date = this.dateFiltre();
    return this.objectifsOnglet()
      .filter((o) => !this.statutFiltre() || statutObjectif(o, DATE_DONNEES) === this.statutFiltre())
      .filter((o) => !periode || (o.debut <= periode.fin && o.fin >= periode.debut))
      .filter((o) => !date || (o.debut <= date && o.fin >= date));
  });

  protected readonly groupes = computed<LabsGroupedTableGroup<Collaborateur, LigneObjectif>[]>(() => {
    const collaborateurs = this.collaborateursFiltres();
    if (this.vue() === 'sans') {
      return collaborateurs.filter((c) => !this.totalParCollaborateur().has(c.id)).map((c) => ({ key: c.id, data: c, rows: [] }));
    }
    return collaborateurs
      .map((c) => ({ key: c.id, data: c, rows: this.objectifsFiltres().filter((o) => o.employeId === c.id).map((o) => this.ligne(o)) }))
      .filter((g) => g.rows.length > 0);
  });

  protected readonly totalPages = computed(() => Math.ceil(this.groupes().length / TAILLE_PAGE));
  protected readonly groupesPage = computed(() => this.groupes().slice((this.page() - 1) * TAILLE_PAGE, this.page() * TAILLE_PAGE));
  protected readonly resumePagination = computed(() => {
    const n = this.groupes().length;
    if (n === 0) return '0 - 0 sur 0 collaborateurs — page 0/0';
    const debut = (this.page() - 1) * TAILLE_PAGE + 1;
    return `${debut} - ${Math.min(n, this.page() * TAILLE_PAGE)} sur ${n} collaborateurs — page ${this.page()}/${this.totalPages()}`;
  });

  /** Tout est déplié : chaque groupe affiché et chaque objectif à sous-objectifs. */
  protected readonly toutDeplie = computed(() =>
    this.groupesPage().every(
      (g) => this.groupesOuverts().has(g.key) && g.rows.every((l) => !l.aSousObjectifs || this.lignesOuvertes().has(l.objectif.id)),
    ) && this.groupesPage().length > 0,
  );

  protected filtrer<T>(filtre: { set(v: T): void }, valeur: T): void {
    filtre.set(valeur);
    this.page.set(1);
  }

  /** « Période » ou « Préciser une période » : choisir l'un efface l'autre. */
  protected choisirPeriode(id: string): void {
    this.periodeFiltre.set(id);
    if (id) this.dateFiltre.set('');
    this.page.set(1);
  }

  protected choisirDate(date: string): void {
    this.dateFiltre.set(date);
    if (date) this.periodeFiltre.set('');
    this.page.set(1);
  }

  protected changerEtat(id: string): void {
    this.etat.set(id as EtatObjectif);
    this.page.set(1);
  }

  protected basculerTout(): void {
    if (this.toutDeplie()) {
      this.groupesOuverts.set(new Set());
      this.lignesOuvertes.set(new Set());
      return;
    }
    this.groupesOuverts.set(new Set([...this.groupesOuverts(), ...this.groupesPage().map((g) => g.key)]));
    const parents = this.objectifsPerimetre().filter((o) => this.service.sousObjectifs(o.id).length > 0);
    this.lignesOuvertes.set(new Set([...this.lignesOuvertes(), ...parents.map((o) => o.id)]));
  }

  protected creer(employeId?: string): void {
    this.router.navigate([OBJECTIFS_PATH, 'nouveau'], employeId ? { queryParams: { employe: employeId } } : {});
  }

  protected ouvrir(id: string): void {
    this.menuOuvert.set(null);
    this.router.navigate([OBJECTIFS_PATH, id]);
  }

  protected modifier(id: string): void {
    this.menuOuvert.set(null);
    this.router.navigate([OBJECTIFS_PATH, id, 'modifier']);
  }

  protected demanderSuppression(objectif: Objectif): void {
    this.menuOuvert.set(null);
    this.aSupprimer.set(objectif);
  }

  protected mettreAJour(valeur: number): void {
    const objectif = this.aMettreAJour();
    if (!objectif) return;
    this.service.mettreAJour(objectif.id, valeur);
    this.aMettreAJour.set(null);
    this.message.set(`« ${objectif.titre} » mis à jour.`);
  }

  protected readonly confirmerSuppression: DialogAction = {
    label: 'Supprimer',
    onClick: () => {
      const objectif = this.aSupprimer();
      if (!objectif) return;
      this.service.supprimer(objectif.id);
      this.aSupprimer.set(null);
      this.message.set(`« ${objectif.titre} » supprimé.`);
    },
  };
  protected readonly annulerSuppression: DialogAction = { label: 'Annuler', onClick: () => this.aSupprimer.set(null) };

  private ligne(o: Objectif): LigneObjectif {
    const enfants = this.service.sousObjectifs(o.id);
    return { objectif: o, statut: statutObjectif(o, DATE_DONNEES), progression: progressionObjectif(o, enfants), aSousObjectifs: enfants.length > 0 };
  }
}
