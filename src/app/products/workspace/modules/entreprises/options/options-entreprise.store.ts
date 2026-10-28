import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, Injector, afterNextRender, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { SessionService } from '../../../../../core/session/session.service';
import type { EtatOptionsEntreprise, OptionEntreprise, ProduitOption } from '../models/option-entreprise.model';
import { EntreprisesService } from '../services/entreprises.service';
import { TAGS_OFFRE, compter, correspond, estActive, offreDe, type FiltreOptions } from './options-entreprise';

/**
 * État partagé de « Fonctionnalités et options » (fourni par la page, injecté par chaque variante) : options, brouillon
 * des options cochées, recherche et filtres, enregistrement, panneau de détail. Les variantes (liste, catalogue, offre)
 * ne diffèrent que par la présentation.
 */
@Injectable()
export class OptionsEntrepriseStore {
  private readonly service = inject(EntreprisesService);
  private readonly session = inject(SessionService);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  readonly entrepriseId = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('id') ?? '')), { initialValue: '' });
  readonly entreprise = toSignal(toObservable(this.entrepriseId).pipe(switchMap((id) => this.service.getById(id))));
  readonly options = toSignal(this.service.getOptions(), { initialValue: [] as OptionEntreprise[] });
  readonly produits = this.service.produitsOptions();
  /** Options reçues : avant, ni résumé ni état vide (pas de « Aucune option » pendant le chargement). */
  readonly charge = computed(() => this.options().length > 0);

  /** Options cochées enregistrées, et brouillon en cours (ce que montre la page). */
  private readonly enregistrees = signal<ReadonlySet<string>>(new Set());
  readonly actives = signal<ReadonlySet<string>>(new Set());
  readonly derniereModification = signal<EtatOptionsEntreprise['derniereModification']>({ par: '—', le: '' });

  readonly produit = signal<ProduitOption | 'tous'>('tous');
  readonly filtre = signal<FiltreOptions>('toutes');
  readonly recherche = signal('');
  readonly detail = signal<OptionEntreprise | null>(null);
  readonly enregistrement = signal(false);
  readonly enregistre = signal(false);

  private declencheurDetail: HTMLElement | null = null;
  private minuteurEnregistre?: ReturnType<typeof setTimeout>;

  constructor() {
    toObservable(this.entrepriseId)
      .pipe(switchMap((id) => this.service.getEtatOptions(id)))
      .subscribe((etat) => this.appliquerEtat(etat));
    inject(DestroyRef).onDestroy(() => clearTimeout(this.minuteurEnregistre));
  }

  readonly estActive = (option: OptionEntreprise): boolean => estActive(option, this.actives());

  /** L'option passe-t-elle le filtre rapide et la recherche courants ? */
  readonly correspond = (option: OptionEntreprise, filtre: FiltreOptions = this.filtre()): boolean =>
    correspond(option, this.options(), this.actives(), filtre, this.recherche());

  readonly offre = (option: OptionEntreprise) => offreDe(option, this.options());

  readonly sousOptions = (option: OptionEntreprise): OptionEntreprise[] => this.options().filter((o) => o.parentId === option.id);

  readonly resume = computed(() => {
    const actives = this.options().filter((o) => this.estActive(o));
    const n = actives.length;
    const p = actives.filter((o) => o.offre === 'payant').length;
    return `${n} ${n > 1 ? 'options activées' : 'option activée'}, dont ${p} ${p > 1 ? 'payantes' : 'payante'}`;
  });

  /** Options dont l'état coché diffère de l'état enregistré. */
  readonly nbModifications = computed(() => {
    const a = this.actives();
    const e = this.enregistrees();
    return [...a].filter((id) => !e.has(id)).length + [...e].filter((id) => !a.has(id)).length;
  });

  compteur(produit: ProduitOption | 'tous'): { activees: number; total: number } {
    const options = produit === 'tous' ? this.options() : this.options().filter((o) => o.produit === produit);
    return compter(options, this.actives());
  }

  basculer(option: OptionEntreprise, active: boolean): void {
    const suivantes = new Set(this.actives());
    if (active) suivantes.add(option.id);
    else suivantes.delete(option.id);
    this.actives.set(suivantes);
    this.enregistre.set(false);
  }

  annuler(): void {
    this.actives.set(new Set(this.enregistrees()));
  }

  enregistrer(): void {
    this.enregistrement.set(true);
    this.service.enregistrerOptions(this.entrepriseId(), [...this.actives()], this.session.user().name).subscribe((etat) => {
      this.appliquerEtat(etat);
      this.enregistrement.set(false);
      this.enregistre.set(true);
      clearTimeout(this.minuteurEnregistre);
      this.minuteurEnregistre = setTimeout(() => this.enregistre.set(false), 4000);
    });
  }

  ouvrirDetail(option: OptionEntreprise): void {
    this.declencheurDetail = this.document.activeElement as HTMLElement | null;
    this.detail.set(option);
  }

  /**
   * Fermeture du panneau : le focus revient sur l'élément qui l'a ouvert ; après un clic sur une tuile (hors bouton, le
   * focus était sur la page), sur le libellé de l'option.
   */
  fermerDetail(): void {
    const option = this.detail();
    const declencheur = this.declencheurDetail;
    this.detail.set(null);
    this.declencheurDetail = null;
    if (declencheur && declencheur !== this.document.body) declencheur.focus();
    else if (option) this.document.querySelector<HTMLElement>(`[data-option="${option.id}"] [data-part="label"]`)?.focus();
  }

  /** Après un rendu (l'élément peut changer de section), place le focus sur le premier élément trouvé. */
  focaliser(...selecteurs: string[]): void {
    afterNextRender(
      () => {
        for (const s of selecteurs) {
          const el = this.document.querySelector<HTMLElement>(s);
          if (el) return el.focus();
        }
      },
      { injector: this.injector },
    );
  }

  libelleProduit(produit: ProduitOption): string {
    return this.produits.find((p) => p.id === produit)?.libelle ?? produit;
  }

  libelleOption(id: string): string {
    return this.options().find((o) => o.id === id)?.libelle ?? '';
  }

  libelleOffre(option: OptionEntreprise): string {
    const offre = this.offre(option);
    const libelle = offre ? TAGS_OFFRE[offre].libelle : '—';
    return option.parentId ? `Suit l'option parente (${libelle})` : libelle;
  }

  private appliquerEtat(etat: EtatOptionsEntreprise): void {
    this.enregistrees.set(new Set(etat.actives));
    this.actives.set(new Set(etat.actives));
    this.derniereModification.set(etat.derniereModification);
  }
}
