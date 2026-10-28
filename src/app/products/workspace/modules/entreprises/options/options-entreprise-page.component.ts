import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  SocBreadcrumb,
  SocDrawer,
  SocDrawerDetailItem,
  SocMessage,
  SocMessageContent,
  SocPageBreadcrumb,
  SocPageDetails,
  SocSearchBar,
  SocSelectableChips,
  SocTag,
} from '@socium-design/angular-components';
import { map, switchMap } from 'rxjs';
import { PRODUITS_OPTIONS } from '../../../../../../mocks/data/options-entreprise.mock';
import { SessionService } from '../../../../../core/session/session.service';
import {
  SocLabsChangesBar,
  SocLabsNavList,
  SocLabsOptionRow,
  SocLabsOptionRowTags,
  SocLabsTag,
  type LabsNavListItem,
} from '../../../../../shared/labs/labs';
import type { EtatOptionsEntreprise, OptionEntreprise, ProduitOption } from '../models/option-entreprise.model';
import { EntreprisesService } from '../services/entreprises.service';
import {
  FILTRES_OPTIONS,
  MESSAGE_OPTION_PAYANTE,
  TAGS_OFFRE,
  compter,
  estActive,
  grouperOptions,
  offreDe,
  type FiltreOptions,
} from './options-entreprise';

const dateFr = (iso: string) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '—');

/**
 * Workspace > Entreprises > {entreprise} > Fonctionnalités et options — remplace la page des « feature flags ».
 * Colonne gauche : produits (compteur activées / total). Barre d'outils : recherche (libellé et description) et filtres
 * rapides. Liste groupée par produit (`soc-labs-option-row`), sous-options imbriquées et désactivées tant que le parent est
 * coupé. Une option payante s'active après une confirmation dans la ligne. Les changements s'appliquent à l'enregistrement
 * (`soc-labs-changes-bar`). Clic sur un libellé : détail dans un `soc-drawer`.
 */
@Component({
  selector: 'app-options-entreprise-page',
  imports: [
    SocPageDetails,
    SocPageBreadcrumb,
    SocBreadcrumb,
    SocSearchBar,
    SocSelectableChips,
    SocTag,
    SocMessage,
    SocMessageContent,
    SocDrawer,
    SocDrawerDetailItem,
    SocLabsNavList,
    SocLabsOptionRow,
    SocLabsOptionRowTags,
    SocLabsTag,
    SocLabsChangesBar,
  ],
  styleUrl: './options-entreprise-page.component.scss',
  template: `
    <soc-page-details title="Fonctionnalités et options" [topStatusLabel]="entreprise()?.nom ?? ''" [description]="resume()">
      <soc-breadcrumb socPageBreadcrumb [items]="breadcrumb()" />

      <div class="options">
        <aside class="options__produits">
          <soc-labs-nav-list ariaLabel="Produits" [items]="produitsNav()" [value]="produit()" (valueChange)="produit.set($any($event))" />
        </aside>

        <div class="options__contenu">
          <div class="options__outils">
            <soc-search-bar
              class="options__recherche"
              placeholder="Rechercher une option (libellé ou description)"
              [value]="recherche()"
              (valueChange)="recherche.set($event)"
              data-testid="recherche"
            />
            <div class="options__filtres" role="group" aria-label="Filtrer les options" data-testid="filtres">
              @for (f of filtres; track f.id) {
                <soc-selectable-chips [label]="f.libelle" [selected]="filtre() === f.id" (click)="filtre.set(f.id)" />
              }
            </div>
          </div>
          <p class="options__modification" data-testid="derniere-modification">
            Dernière modification par {{ derniereModification().par }} le {{ dateFr(derniereModification().le) }}
          </p>
          <p class="sr-only" aria-live="polite">{{ annonceResultats() }}</p>

          @for (groupe of groupes(); track groupe.produit) {
            <section class="options__groupe" [attr.aria-labelledby]="'groupe-' + groupe.produit" [attr.data-produit]="groupe.produit">
              <h2 class="options__titre-groupe" [id]="'groupe-' + groupe.produit">
                {{ groupe.libelle }}
                <span class="options__compteur-groupe">{{ compteurProduit(groupe.produit) }}</span>
              </h2>
              <div role="list" class="options__liste">
                @for (ligne of groupe.lignes; track ligne.option.id) {
                  <soc-labs-option-row
                    [label]="ligne.option.libelle"
                    [description]="ligne.option.description"
                    [checked]="actives().has(ligne.option.id)"
                    (checkedChange)="basculer(ligne.option, $event)"
                    [isNew]="!!ligne.option.nouveau"
                    [confirmMessage]="ligne.option.offre === 'payant' ? messagePayante : undefined"
                    (labelClick)="ouvrirDetail(ligne.option)"
                    [attr.data-option]="ligne.option.id"
                  >
                    @if (ligne.option.offre === 'payant') {
                      <soc-tag socLabsOptionRowTags color="orange">{{ tags.payant.libelle }}</soc-tag>
                    }
                    @if (ligne.option.offre === 'standard') {
                      <soc-labs-tag socLabsOptionRowTags>{{ tags.standard.libelle }}</soc-labs-tag>
                    }
                    @if (ligne.option.offre === 'customisation') {
                      <soc-tag socLabsOptionRowTags color="purple">{{ tags.customisation.libelle }}</soc-tag>
                    }
                    @for (sous of ligne.sousOptions; track sous.id) {
                      <soc-labs-option-row
                        [label]="sous.libelle"
                        [description]="sous.description"
                        [checked]="estActive(sous)"
                        (checkedChange)="basculer(sous, $event)"
                        [disabled]="!actives().has(ligne.option.id)"
                        [disabledReason]="'Activez d’abord « ' + ligne.option.libelle + ' ».'"
                        [isNew]="!!sous.nouveau"
                        (labelClick)="ouvrirDetail(sous)"
                        [attr.data-option]="sous.id"
                      />
                    }
                  </soc-labs-option-row>
                }
              </div>
            </section>
          } @empty {
            <soc-message variant="inline" status="info" data-testid="vide">
              <span socMessageContent>Aucune option ne correspond à votre recherche.</span>
            </soc-message>
          }
        </div>
      </div>

      <soc-labs-changes-bar
        [count]="nbModifications()"
        [saved]="enregistre()"
        [saving]="enregistrement()"
        (save)="enregistrer()"
        (cancel)="annuler()"
      />
    </soc-page-details>

    @if (detail(); as d) {
      <soc-drawer [open]="true" [title]="d.libelle" [topline]="libelleProduit(d.produit)" (close)="fermerDetail()">
        <soc-drawer-detail-item label="Description" [value]="d.description" />
        <soc-drawer-detail-item label="Offre" [value]="libelleOffre(d)" />
        <soc-drawer-detail-item label="Produit" [value]="libelleProduit(d.produit)" />
        <soc-drawer-detail-item label="État" [value]="estActive(d) ? 'Activée' : 'Désactivée'" />
        @if (d.parentId) {
          <soc-drawer-detail-item label="Option parente" [value]="libelleOption(d.parentId)" />
        }
        @if (sousOptionsDe(d).length) {
          <soc-drawer-detail-item label="Sous-options" [value]="sousOptionsDe(d)" />
        }
        <soc-drawer-detail-item label="Mise en ligne" [value]="dateFr(d.miseEnLigne)" />
      </soc-drawer>
    }
  `,
})
export class OptionsEntreprisePageComponent {
  private readonly service = inject(EntreprisesService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  private readonly entrepriseId = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('id') ?? '')), { initialValue: '' });
  protected readonly entreprise = toSignal(toObservable(this.entrepriseId).pipe(switchMap((id) => this.service.getById(id))));
  protected readonly options = toSignal(this.service.getOptions(), { initialValue: [] as OptionEntreprise[] });

  /** Options cochées enregistrées, et brouillon en cours (ce que montre la page). */
  private readonly enregistrees = signal<ReadonlySet<string>>(new Set());
  protected readonly actives = signal<ReadonlySet<string>>(new Set());
  protected readonly derniereModification = signal<EtatOptionsEntreprise['derniereModification']>({ par: '—', le: '' });

  protected readonly produit = signal<ProduitOption | 'tous'>('tous');
  protected readonly filtre = signal<FiltreOptions>('toutes');
  protected readonly recherche = signal('');
  protected readonly detail = signal<OptionEntreprise | null>(null);
  protected readonly enregistrement = signal(false);
  protected readonly enregistre = signal(false);

  protected readonly filtres = FILTRES_OPTIONS;
  protected readonly tags = TAGS_OFFRE;
  protected readonly messagePayante = MESSAGE_OPTION_PAYANTE;
  protected readonly dateFr = dateFr;

  private declencheurDetail: HTMLElement | null = null;
  private minuteurEnregistre?: ReturnType<typeof setTimeout>;

  constructor() {
    toObservable(this.entrepriseId)
      .pipe(switchMap((id) => this.service.getEtatOptions(id)))
      .subscribe((etat) => this.appliquerEtat(etat));
    this.destroyRef.onDestroy(() => clearTimeout(this.minuteurEnregistre));
  }

  protected readonly breadcrumb = computed(() => [
    { label: 'Entreprises', onClick: () => this.router.navigateByUrl('/workspace/entreprises') },
    { label: this.entreprise()?.nom ?? '…' },
    { label: 'Fonctionnalités et options' },
  ]);

  protected readonly resume = computed(() => {
    const actives = this.options().filter((o) => this.estActive(o));
    const n = actives.length;
    const p = actives.filter((o) => o.offre === 'payant').length;
    return `${n} ${n > 1 ? 'options activées' : 'option activée'}, dont ${p} ${p > 1 ? 'payantes' : 'payante'}`;
  });

  protected readonly produitsNav = computed<LabsNavListItem[]>(() => {
    const item = (id: string, label: string, opts: OptionEntreprise[]): LabsNavListItem => {
      const { activees, total } = compter(opts, this.actives());
      return { id, label, count: `${activees} / ${total}`, countLabel: `${activees} ${activees > 1 ? 'activées' : 'activée'} sur ${total}` };
    };
    return [
      item('tous', 'Tous les produits', this.options()),
      ...PRODUITS_OPTIONS.map((p) => item(p.id, p.libelle, this.options().filter((o) => o.produit === p.id))),
    ];
  });

  protected readonly groupes = computed(() =>
    grouperOptions(this.options(), PRODUITS_OPTIONS, this.actives(), this.filtre(), this.recherche(), this.produit()),
  );

  protected readonly annonceResultats = computed(() => {
    const n = this.groupes().reduce((t, g) => t + g.lignes.length + g.lignes.reduce((s, l) => s + l.sousOptions.length, 0), 0);
    return n ? `${n} ${n > 1 ? 'options affichées' : 'option affichée'}` : 'Aucune option ne correspond à votre recherche.';
  });

  /** Options dont l'état coché diffère de l'état enregistré. */
  protected readonly nbModifications = computed(() => {
    const a = this.actives();
    const e = this.enregistrees();
    return [...a].filter((id) => !e.has(id)).length + [...e].filter((id) => !a.has(id)).length;
  });

  protected estActive = (option: OptionEntreprise): boolean => estActive(option, this.actives());

  protected compteurProduit(produit: ProduitOption): string {
    const { activees, total } = compter(
      this.options().filter((o) => o.produit === produit),
      this.actives(),
    );
    return `${activees} / ${total} activées`;
  }

  protected basculer(option: OptionEntreprise, active: boolean): void {
    const suivantes = new Set(this.actives());
    if (active) suivantes.add(option.id);
    else suivantes.delete(option.id);
    this.actives.set(suivantes);
    this.enregistre.set(false);
  }

  protected annuler(): void {
    this.actives.set(new Set(this.enregistrees()));
  }

  protected enregistrer(): void {
    this.enregistrement.set(true);
    this.service.enregistrerOptions(this.entrepriseId(), [...this.actives()], this.session.user().name).subscribe((etat) => {
      this.appliquerEtat(etat);
      this.enregistrement.set(false);
      this.enregistre.set(true);
      clearTimeout(this.minuteurEnregistre);
      this.minuteurEnregistre = setTimeout(() => this.enregistre.set(false), 4000);
    });
  }

  protected ouvrirDetail(option: OptionEntreprise): void {
    this.declencheurDetail = this.document.activeElement as HTMLElement | null;
    this.detail.set(option);
  }

  /** Fermeture du panneau : le focus revient sur le libellé qui l'a ouvert. */
  protected fermerDetail(): void {
    this.detail.set(null);
    this.declencheurDetail?.focus();
    this.declencheurDetail = null;
  }

  protected libelleProduit(produit: ProduitOption): string {
    return PRODUITS_OPTIONS.find((p) => p.id === produit)?.libelle ?? produit;
  }

  protected libelleOption(id: string): string {
    return this.options().find((o) => o.id === id)?.libelle ?? '';
  }

  protected libelleOffre(option: OptionEntreprise): string {
    const offre = offreDe(option, this.options());
    const libelle = offre ? TAGS_OFFRE[offre].libelle : '—';
    return option.parentId ? `Suit l'option parente (${libelle})` : libelle;
  }

  protected sousOptionsDe(option: OptionEntreprise): string {
    return this.options()
      .filter((o) => o.parentId === option.id)
      .map((o) => `${o.libelle} (${this.estActive(o) ? 'activée' : 'désactivée'})`)
      .join(', ');
  }

  private appliquerEtat(etat: EtatOptionsEntreprise): void {
    this.enregistrees.set(new Set(etat.actives));
    this.actives.set(new Set(etat.actives));
    this.derniereModification.set(etat.derniereModification);
  }
}
