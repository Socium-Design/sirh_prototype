# SIRH Socium — Prototype multi-produits (Angular 19)

## Contexte du projet

Ce dépôt est le prototype vivant de l'ensemble du SIRH Socium — tous
les produits (Workspace, Perf, Job, Workflow, Doc, Payroll — la liste
s'étend avec le temps) dans une seule application Angular, déployée
sur un seul lien.

## Style Angular à respecter strictement

- **Composants standalone uniquement** — jamais de `NgModule`. Ne pas
  ajouter `standalone: true` explicitement (c'est le défaut en
  Angular 19), sauf si le style de code du reste du dépôt le fait déjà.
- **Nouvelle syntaxe de contrôle** dans les templates — `@if`, `@for`,
  `@switch` — jamais `*ngIf`, `*ngFor`, `*ngSwitch`.
- **Routes paresseuses** (`loadChildren`) à chaque niveau produit et
  module — jamais tout importé dans un seul fichier de routes.
- **Signals** pour l'état des composants quand c'est pertinent
  (`signal()`, `input()`, `output()`) plutôt que des `@Input`/`@Output`
  classiques si le reste du code du dépôt utilise déjà ce style.

## Architecture — Produit → Module → Fonctionnalité

- Un produit = un dossier sous `src/app/products/<produit>/`, avec son
  propre fichier `<produit>.routes.ts`
- Un module = un dossier sous `.../modules/<module>/`, avec son propre
  `<module>.routes.ts`
- Une fonctionnalité = un ou plusieurs composants à l'intérieur du
  dossier du module

Avant de créer un nouveau produit ou module, vérifie s'il existe déjà.

## Composants — toujours depuis le design system Angular

Tous les éléments d'interface viennent de **`@socium-design/angular-components`** (dépendance du projet, paquet privé
GitHub Packages). Ne jamais improviser un composant qui ressemble à un composant du kit sans l'importer réellement.

**Avant d'utiliser un composant, lis sa signature réelle** (inputs, outputs, slots, types) dans la référence générée
depuis le code du kit — ne devine jamais un nom de prop par analogie avec le HTML natif :

- `node_modules/@socium-design/angular-components/docs/generated/components.md` — référence de tous les composants
  (chercher le composant avec Grep plutôt que de lire tout le fichier)
- `node_modules/@socium-design/angular-components/docs/USAGE.md` — conventions (slots, formulaires, booléens, overlays)
- `docs/design-system.md` (dans ce dépôt) — quel template de page pour quel besoin, et les patrons de pages du prototype

Le design system est **en lecture seule** ici : ne jamais modifier `node_modules`. S'il manque quelque chose
(composant, prop, variante, écart visuel), signale-le comme `GAP-DS` (voir `docs/guidelines.md`) et propose une
solution de contournement honnête (jamais un faux composant maison qui imite le kit).

La feuille de style du kit (`styles.css` : tokens, polices, styles des composants) est déjà chargée par `angular.json` ;
aucune configuration Tailwind n'est nécessaire. Pour un style propre à l'application, utiliser le SCSS du composant et
les variables CSS du kit (`var(--bridges-position-gap-md)`…), jamais de valeurs en dur.

## De la spec à la page (workflow)

Quand on te donne une spec (page, fonctionnalité, module) :

1. **Cadrer** : produit, module, type de page. Vérifier ce qui existe déjà (`src/app/products/`, `navigation.map.ts`).
2. **Choisir le template de page** du kit (`soc-page-list` / `details` / `form` / `profile` / `home`) — voir `docs/design-system.md`.
3. **Lire** la référence des composants envisagés (`components.md`), puis écrire la page.
4. **Données** : mock typé dans `src/mocks/data/` + service dans le module ; jamais de données inventées dans le composant.
5. **Brancher** : route du module (lazy), puis entrée de menu dans `src/app/core/navigation/navigation.map.ts`.
6. **Vérifier pour de vrai** : `npm run build` et `npm run test:ci`, puis lancer l'application (`npm start`) et regarder la page dans le
   navigateur (aperçu) — clic sur chaque action, recherche, pagination, états vides. Un build vert ne prouve pas que la page est juste.
7. **Écrire un test** de la page (rendu + interactions clés), sur le modèle de `employes-page.component.spec.ts`.
8. Commit `<Produit> > <Module> : description`, sur la branche `feature/<produit>-<module>`. Ne jamais pousser sur `main`.

La page **de référence** (liste filtrable et paginée) est `src/app/products/workspace/modules/employes/`. La commande
`/nouvelle-page` déroule ce workflow.

## Shell applicatif et navigation

Toute page s'affiche dans `AppLayoutComponent` (`soc-app-shell` : AppSwitch + header + menu latéral), configuré une fois pour
toutes. Le produit et l'item de menu actifs sont **dérivés de l'URL** ; ne jamais les stocker. Une nouvelle page = une route +
une ligne dans `NAV_ROUTES` (`navigation.map.ts`). Un item de menu sans entrée mène à la page « bientôt disponible ».
Écart connu à arbitrer : le menu Workspace du kit n'a pas « Compétences » ni « Carrières » (présents dans le menu Perfs).

## Données — toujours depuis le backend fictif partagé

Toutes les données viennent de `src/mocks/data/` — un jeu de données
unique et cohérent, partagé par tout le prototype.

## Guidelines complètes

@docs/guidelines.md

## Convention de branches

`feature/<produit>-<module>` — ex. `feature/perf-formation`.

## Convention de commits

`<Produit> > <Module> : description courte`.

## Avant de considérer un module terminé

- [ ] Composants standalone, nouvelle syntaxe de contrôle (`@if`/`@for`)
- [ ] Routes chargées en `loadChildren`, pas importées en dur
- [ ] Aucun composant improvisé — tout vient du kit ou est `GAP-DS`
- [ ] Entrée ajoutée dans `navigation.map.ts` ; `npm run build` et `npm run test:ci` verts
- [ ] Page vérifiée dans le navigateur (actions, recherche, pagination, états vides), pas seulement compilée
- [ ] Test de la page écrit
- [ ] Données depuis `src/mocks/data/`, jamais inventées localement
