/** Un onglet de la page Configuration : libellé affiché + segment de route enfant (`/workspace/configuration/<route>`). */
export interface OngletConfiguration {
  libelle: string;
  route: string;
}

/**
 * Onglets de la page Configuration, dans l'ordre d'affichage — le premier est l'onglet par défaut.
 * Ajouter une configuration = une ligne ici + la route enfant correspondante dans `configuration.routes.ts`.
 */
export const ONGLETS_CONFIGURATION: OngletConfiguration[] = [
  { libelle: 'Populations', route: 'populations' },
  { libelle: 'Gestion des tableaux de bord', route: 'tableaux-de-bord' },
];

export const CONFIGURATION_PATH = '/workspace/configuration';

/** Onglet actif d'après l'URL ; les sous-pages (`populations/nouvelle`…) gardent l'onglet de leur liste. */
export function ongletDepuisUrl(url: string): OngletConfiguration | undefined {
  const chemin = url.split(/[?#]/)[0];
  if (!chemin.startsWith(`${CONFIGURATION_PATH}/`)) return undefined;
  const segment = chemin.slice(CONFIGURATION_PATH.length + 1).split('/')[0];
  return ONGLETS_CONFIGURATION.find((o) => o.route === segment);
}
