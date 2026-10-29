import type { OffreOption, OptionEntreprise, ProduitOption } from '../models/option-entreprise.model';

/** Filtres rapides de la barre d'outils. */
export type FiltreOptions = 'toutes' | 'payantes' | 'standard' | 'customisations' | 'activees' | 'nouveautes';

export const FILTRES_OPTIONS: { id: FiltreOptions; libelle: string }[] = [
  { id: 'toutes', libelle: 'Toutes' },
  { id: 'payantes', libelle: 'Payantes' },
  { id: 'standard', libelle: 'Standard' },
  { id: 'customisations', libelle: 'Customisations' },
  { id: 'activees', libelle: 'Activées' },
  { id: 'nouveautes', libelle: 'Nouveautés' },
];

/** Tag d'offre : texte toujours présent, la couleur n'est qu'un repère (orange 6,3:1, neutre 9,4:1, violet 5,0:1). */
export const TAGS_OFFRE: Record<OffreOption, { libelle: string; couleur: 'orange' | 'neutral' | 'purple' }> = {
  payant: { libelle: 'Payant', couleur: 'orange' },
  standard: { libelle: 'Standard', couleur: 'neutral' },
  customisation: { libelle: 'Customisation client', couleur: 'purple' },
};

/** Ligne d'explication affichée au-dessus de la liste quand le filtre « Nouveautés » est actif. */
export const EXPLICATION_NOUVEAUTES = 'Options ajoutées ces 30 derniers jours.';

/** Date ISO (`AAAA-MM-JJ`) en français, lue en UTC pour ne pas changer de jour selon le fuseau. */
export const dateCourte = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
export const dateLongue = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export const MESSAGE_OPTION_PAYANTE = "Option payante : vérifiez qu'elle a été vendue au client.";

/** Une option de premier niveau et ses sous-options visibles. */
export interface LigneOption {
  option: OptionEntreprise;
  sousOptions: OptionEntreprise[];
}

export interface GroupeOptions {
  produit: ProduitOption;
  libelle: string;
  lignes: LigneOption[];
}

/** Offre d'une option : une sous-option suit celle de son parent. */
export function offreDe(option: OptionEntreprise, options: OptionEntreprise[]): OffreOption | null {
  if (option.offre || !option.parentId) return option.offre;
  return options.find((o) => o.id === option.parentId)?.offre ?? null;
}

/** Option réellement active : cochée, et parent actif s'il y en a un. */
export function estActive(option: OptionEntreprise, actives: ReadonlySet<string>): boolean {
  return actives.has(option.id) && (!option.parentId || actives.has(option.parentId));
}

/** Mots d'un texte, sans accents ni casse (« Étape d'intégration » → `etape`, `d`, `integration`). */
const mots = (texte: string): string[] =>
  texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/**
 * Recherche par début de mot : chaque mot saisi doit commencer un mot du libellé ou de la description (« formation »
 * trouve « Formations » et « formation », pas « information » ; « etape mat » trouve « Étape Matériel »).
 */
export function correspondRecherche(option: OptionEntreprise, recherche: string): boolean {
  const saisis = mots(recherche);
  if (!saisis.length) return true;
  const texte = mots(`${option.libelle} ${option.description}`);
  return saisis.every((q) => texte.some((m) => m.startsWith(q)));
}

/** L'option passe-t-elle le filtre rapide et la recherche (début des mots du libellé et de la description) ? */
export function correspond(
  option: OptionEntreprise,
  options: OptionEntreprise[],
  actives: ReadonlySet<string>,
  filtre: FiltreOptions,
  recherche: string,
): boolean {
  if (!correspondRecherche(option, recherche)) return false;
  const offre = offreDe(option, options);
  switch (filtre) {
    case 'payantes':
      return offre === 'payant';
    case 'standard':
      return offre === 'standard';
    case 'customisations':
      return offre === 'customisation';
    case 'activees':
      return estActive(option, actives);
    case 'nouveautes':
      return !!option.nouveau;
    default:
      return true;
  }
}

/**
 * Lignes visibles, groupées par produit. Une option de premier niveau est visible si elle correspond, ou si l'une de ses
 * sous-options correspond (le parent reste affiché pour donner le contexte). Si le parent correspond, toutes ses
 * sous-options suivent ; sinon, seules celles qui correspondent. Exception : « Activées » ne montre que les
 * sous-options activées, même sous un parent activé.
 */
export function grouperOptions(
  options: OptionEntreprise[],
  produits: { id: ProduitOption; libelle: string }[],
  actives: ReadonlySet<string>,
  filtre: FiltreOptions,
  recherche: string,
  produit: ProduitOption | 'tous',
): GroupeOptions[] {
  const ok = (o: OptionEntreprise) => correspond(o, options, actives, filtre, recherche);
  return produits
    .filter((p) => produit === 'tous' || p.id === produit)
    .map((p) => {
      const lignes: LigneOption[] = [];
      for (const option of options.filter((o) => o.produit === p.id && !o.parentId)) {
        const enfants = options.filter((o) => o.parentId === option.id);
        const parentOk = ok(option);
        const enfantsOk = parentOk && filtre !== 'activees' ? enfants : enfants.filter(ok);
        if (parentOk || enfantsOk.length) lignes.push({ option, sousOptions: enfantsOk });
      }
      return { produit: p.id, libelle: p.libelle, lignes };
    })
    .filter((g) => g.lignes.length > 0);
}

/** Compteur « activées / total » d'un ensemble d'options (sous-options comprises). */
export function compter(options: OptionEntreprise[], actives: ReadonlySet<string>): { activees: number; total: number } {
  return { activees: options.filter((o) => estActive(o, actives)).length, total: options.length };
}
