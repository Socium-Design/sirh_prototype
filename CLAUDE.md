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

Tous les éléments d'interface viennent de `@socium-ds/angular-components`
(nom à confirmer une fois le package renommé). Ne jamais improviser un
composant qui ressemble à un composant du kit sans l'importer
réellement. Avant d'utiliser un composant, lis sa vraie signature
d'`@Input`/`input()` dans le code source du package — ne devine jamais
un nom de prop par analogie avec un équivalent HTML natif.

Si un composant nécessaire n'existe pas dans le kit, signale-le comme
`GAP-DS` (voir `docs/guidelines.md`) plutôt que de l'inventer.

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
- [ ] Données depuis `src/mocks/data/`, jamais inventées localement
