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

## Composants Labs (expérimentaux)

Le kit publie depuis la 0.2.0 une zone **Labs** : `@socium-design/angular-components/labs`. Ce sont des composants qui
comblent un `GAP-DS` en attendant une décision de l'équipe design ; ils peuvent changer sans garantie de compatibilité.
Documentation embarquée : `node_modules/@socium-design/angular-components/labs/README.md` (statut de chaque composant et
issue GAP-DS associée) et la section « Labs (expérimental) » de `docs/generated/components.md`.

**Quand un composant manque dans le kit :**

1. Chercher dans Labs (README + référence générée).
2. S'il n'y est pas : ne rien bricoler dans la page — signaler un `GAP-DS` et proposer de le créer dans Labs (dépôt
   `design_system_angular`) ; attendre l'accord avant de le faire.
3. Importer les composants Labs **uniquement** depuis `src/app/shared/labs/labs.ts` (jamais
   `@socium-design/angular-components/labs` directement dans une page) : `grep -r "shared/labs/labs" src` liste tous
   les usages, à mettre à jour lors d'une promotion (`SocLabsX` → `SocX` depuis le point d'entrée principal).
4. Ne jamais promouvoir un composant Labs dans le kit officiel : décision de l'équipe design.

| Composant Labs | Utilisé dans |
|---|---|
| `soc-labs-workspace-layout` | Composition d'un tableau de bord (barre du haut + 3 colonnes défilant séparément) |
| `soc-labs-compact-field` | Composition — panneau « Informations » (Libellé, Description, Population) |
| `soc-labs-pill-toggle` | Composition — statut (Actif / Inactif / Archivé) |
| `soc-labs-chart-type-chip` | Composition — cartes de graphe et lignes de la Bibliothèque |
| `soc-labs-drop-zone` | Composition — état vide et emplacement « Ajouter un graphe » (glisser-déposer CDK) |
| `soc-labs-list-row` | Bibliothèque — lignes du catalogue (ajouté, verrouillé, glisser) |
| `soc-labs-icon-button` | Composition (retour, menu d'une carte), Bibliothèque (« + », replier une section) |
| `soc-labs-inline-edit` | Bibliothèque — renommage sur place des sections |
| `soc-labs-fullscreen-overlay` | Composition — « Prévisualiser » |

**Patron « espace de travail »** — `tableau-de-bord-composition-page.component.ts` : `soc-labs-workspace-layout` comme
racine de la page (l'hôte de la page prend `height: 100%` de la zone de contenu du shell), `cdkDropListGroup` sur le
layout pour relier la Bibliothèque (`cdkDrag` sur `soc-labs-list-row`) et la zone centrale (`cdkDropList`).
