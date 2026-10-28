import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { ENTREPRISES, MODULES_ENTREPRISE } from '../../../../../../mocks/data/entreprises.mock';
import { ETATS_OPTIONS_ENTREPRISE, OPTIONS_ENTREPRISE, PRODUITS_OPTIONS } from '../../../../../../mocks/data/options-entreprise.mock';
import type { Entreprise, ModuleEntreprise } from '../models/entreprise.model';
import type { EtatOptionsEntreprise, OptionEntreprise, ProduitOption } from '../models/option-entreprise.model';

/**
 * Accès aux entreprises clientes et à leurs options. Simule un appel HTTP sur le mock partagé ; les écritures
 * (activation, options enregistrées) restent en mémoire le temps de la session du prototype.
 */
@Injectable({ providedIn: 'root' })
export class EntreprisesService {
  private readonly entreprises = ENTREPRISES.map((e) => ({ ...e }));
  private readonly etats: Record<string, EtatOptionsEntreprise> = structuredClone(ETATS_OPTIONS_ENTREPRISE);

  getAll(): Observable<Entreprise[]> {
    return of(this.entreprises.map((e) => ({ ...e }))).pipe(delay(200));
  }

  getById(id: string): Observable<Entreprise | undefined> {
    const entreprise = this.entreprises.find((e) => e.id === id);
    return of(entreprise && { ...entreprise }).pipe(delay(200));
  }

  /** Nom complet d'une pastille de module (« CO » → « Core RH (Workspace) »). */
  libelleModule(module: ModuleEntreprise): string {
    return MODULES_ENTREPRISE[module];
  }

  setActive(id: string, active: boolean): void {
    const entreprise = this.entreprises.find((e) => e.id === id);
    if (entreprise) entreprise.active = active;
  }

  /** Produits qui portent des options, dans l'ordre d'affichage. */
  produitsOptions(): { id: ProduitOption; libelle: string }[] {
    return PRODUITS_OPTIONS;
  }

  getOptions(): Observable<OptionEntreprise[]> {
    return of(OPTIONS_ENTREPRISE).pipe(delay(200));
  }

  getEtatOptions(entrepriseId: string): Observable<EtatOptionsEntreprise> {
    return of(structuredClone(this.etat(entrepriseId))).pipe(delay(200));
  }

  /** Enregistre les options activées ; renvoie le nouvel état (dernière modification : `par`, aujourd'hui). */
  enregistrerOptions(entrepriseId: string, actives: string[], par: string): Observable<EtatOptionsEntreprise> {
    const etat: EtatOptionsEntreprise = { actives: [...actives], derniereModification: { par, le: new Date().toISOString().slice(0, 10) } };
    this.etats[entrepriseId] = etat;
    return of(structuredClone(etat)).pipe(delay(300));
  }

  private etat(entrepriseId: string): EtatOptionsEntreprise {
    return this.etats[entrepriseId] ?? { actives: [], derniereModification: { par: '—', le: '' } };
  }
}
