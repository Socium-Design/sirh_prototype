/** Un onglet de la page Configurations de Perfs : libellé affiché + segment de route enfant (`/perf/configurations/<route>`). */
export interface OngletConfigurations {
  libelle: string;
  route: string;
  /** Faux : l'onglet affiche « À venir » (pas encore construit dans le prototype). */
  construit: boolean;
}

/** Onglets dans l'ordre d'affichage. La page s'ouvre sur « Notes d'évaluation » (`ONGLET_PAR_DEFAUT`), le seul construit. */
export const ONGLETS_CONFIGURATIONS: OngletConfigurations[] = [
  { libelle: 'Configuration des objectifs', route: 'objectifs', construit: false },
  { libelle: "Notes d'évaluation", route: 'notes-evaluation', construit: true },
  { libelle: 'Parcours de validation', route: 'parcours-validation', construit: false },
];

export const ONGLET_PAR_DEFAUT = 'notes-evaluation';

export const CONFIGURATIONS_PATH = '/perf/configurations';

/** Onglet actif d'après l'URL. */
export function ongletDepuisUrl(url: string): OngletConfigurations | undefined {
  const chemin = url.split(/[?#]/)[0];
  if (!chemin.startsWith(`${CONFIGURATIONS_PATH}/`)) return undefined;
  const segment = chemin.slice(CONFIGURATIONS_PATH.length + 1).split('/')[0];
  return ONGLETS_CONFIGURATIONS.find((o) => o.route === segment);
}
