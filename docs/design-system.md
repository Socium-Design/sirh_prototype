# Utiliser le design system dans le prototype

Dépendance : **`@socium-design/angular-components`** (privé, GitHub Packages). Référence exacte des composants :
`node_modules/@socium-design/angular-components/docs/generated/components.md` — à consulter avant chaque usage.

## Quel template de page pour quel besoin ?

| Besoin de la spec | Template | Slots principaux |
|---|---|---|
| Écran d'accueil d'un produit (bienvenue, recherche, cartes) | `soc-page-home` | `socPageBreadcrumb`, `socPageSectionActions` |
| Liste d'objets avec recherche, filtres, pagination | `soc-page-list` | `socPageBreadcrumb`, `socPageBadge`, `socPageActions`, `socPageTabs`, `socPageSecondaryTabs` |
| Consultation d'un objet (non-personne) | `soc-page-details` | `socPageBreadcrumb`, `socPageBadge`, `socPageTag`, `socPageActions` (icônes + tooltip), `socPageTabs` |
| Création / modification | `soc-page-form` | `socPageBreadcrumb`, `socPageStepper`, `socPageMessage`, `socPageActions`, `socPageSecondContent` |
| Fiche d'une personne | `soc-page-profile` | `socPageBreadcrumb`, `socPageHeader` (`soc-profile-line`), `socPageTag`, `socPageTabs`, `socPageMessage` |

Le shell (`soc-app-shell`) est déjà en place dans `AppLayoutComponent` : une page ne l'instancie jamais.

## Patrons

**Liste** — `employes-page.component.ts` : `soc-page-list` + `soc-data-table`. Le tableau est présentationnel : la page possède la
recherche (`(search)`), la pagination (`[pagination]`, `(pageChange)`, `(pageSizeChange)`) et découpe les lignes elle-même. Les cellules riches
(tags, badges) sont des `<ng-template #x let-row>` passés en `render`. Rappel : un seul `@if` par élément projeté dans un slot.

**Formulaire** — `soc-page-form` + champs du kit liés à un `FormGroup` : tous les champs (`soc-input-text`, `soc-select`, `soc-checkbox`,
`soc-radio-button`, `soc-switch`, `soc-multi-select`, `soc-upload-file`…) acceptent `formControlName`. L'état d'erreur se pilote avec
`[error]="champ.invalid && champ.touched"` et `helperText`. Voir la référence `Guides/Formulaires` du Storybook du design system.

**Détail** — `soc-page-details` avec `soc-data-table mode="detail"` pour les paires libellé/valeur, `socPageActions` = boutons icône `tertiary` chacun dans un `soc-tooltip`.

**Actions contextuelles d'une ligne** — `[rowActionsMenu]` (un `<ng-template let-row let-close="close">` avec un `soc-menu`), jamais une `soc-dialog` pour ça.
**Confirmation d'une action destructive** — toujours un `soc-dialog` (`[open]`, `(close)`), jamais `window.confirm`.

## Pièges connus du design system

- Les attributs booléens nus fonctionnent (`<soc-input-text required>`), mais `checked`, `open`, `selected` se lient avec `[x]="true"`.
- Un `output()` n'indique pas s'il est écouté : les options sont des booléens explicites (`searchable`, `rowClickable`, `rowActions`, `showBack`).
- Les panneaux (`soc-popover`, `soc-dialog`, `soc-drawer`, `soc-tooltip`) sont rendus dans `<body>`.
- Icônes : `@lucide/angular`, dans un slot d'icône du composant (`socButtonLeftIcon`, `socCardIcon`…), `class="size-full"`.
