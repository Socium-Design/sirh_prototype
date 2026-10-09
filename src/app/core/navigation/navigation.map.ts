import type { AppShellProduct } from '@socium-design/angular-components';

/**
 * Pont entre le menu du design system (`soc-app-shell` : produits + ids d'items) et le routeur du prototype.
 * C'est LE fichier à compléter chaque fois qu'une page est créée : ajouter l'entrée `NAV_ROUTES` de son item de menu.
 * Un item sans entrée mène à la page « bientôt disponible » (`/a-venir/<id>`) au lieu de ne rien faire.
 */

/** Segment d'URL d'un produit → clé de produit du design system (`perf` côté URL, `perfs` côté design system). */
export const PRODUCT_BY_PATH: Record<string, AppShellProduct> = {
  workspace: 'workspace',
  perf: 'perfs',
  job: 'job',
  workflow: 'workflow',
  doc: 'doc',
  payroll: 'payroll',
};

/** Page d'accueil routée de chaque produit déjà construit (les autres → « bientôt disponible »). */
export const PRODUCT_HOME: Partial<Record<AppShellProduct, string>> = {
  workspace: '/workspace',
  perfs: '/perf',
  job: '/job',
};

/** Id d'item de menu du design system (cf. `NAVIGATION_PRESETS`) → route. */
export const NAV_ROUTES: Record<string, string> = {
  'workspace-postes': '/workspace/postes',
  'workspace-employes': '/workspace/employes',
  // Page à onglets (Populations, Gestion des tableaux de bord) : l'item reste en surbrillance sur tous les onglets et leurs sous-pages.
  'workspace-configurations': '/workspace/configuration',
  'perfs-formations': '/perf/formation',
  'perfs-evaluations': '/perf/evaluation',
  'perfs-objectifs': '/perf/objectifs',
  'job-offres': '/job/offres',
};

export const COMING_SOON_PATH = 'a-venir';

const stripUrl = (url: string): string => url.split(/[?#]/)[0].replace(/\/+$/, '') || '/';

/** Produit actif d'après l'URL (workspace par défaut). */
export function productFromUrl(url: string): AppShellProduct {
  const [first, second] = stripUrl(url).split('/').filter(Boolean);
  if (first === COMING_SOON_PATH && second) return second.split('-')[0] as AppShellProduct;
  return PRODUCT_BY_PATH[first] ?? 'workspace';
}

/**
 * Item de menu à surligner d'après l'URL (undefined si la page n'a pas d'item dans le menu). Les sous-pages d'une route
 * (`/workspace/configuration/populations/nouvelle`) gardent l'item de leur page parente.
 */
export function navItemFromUrl(url: string): string | undefined {
  const path = stripUrl(url);
  const [first, second] = path.split('/').filter(Boolean);
  if (first === COMING_SOON_PATH) return second;
  return Object.entries(NAV_ROUTES).find(([, route]) => path === route || path.startsWith(`${route}/`))?.[0];
}

/** Route à ouvrir quand on clique un item du menu. */
export function routeForNavItem(id: string): string {
  return NAV_ROUTES[id] ?? `/${COMING_SOON_PATH}/${id}`;
}

/** Route à ouvrir quand on change de produit via l'AppSwitch. */
export function routeForProduct(product: AppShellProduct): string {
  return PRODUCT_HOME[product] ?? `/${COMING_SOON_PATH}/${product}-accueil`;
}
