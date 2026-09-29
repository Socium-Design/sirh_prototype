# Guidelines de développement

## Conventions de nommage

| Élément | Convention | Exemple |
|---|---|---|
| Dossiers et fichiers | kebab-case, sans accents | `modules/employes/` |
| Page d'un module | `<module>-page.component.ts` | `employes-page.component.ts` |
| Classe de composant | PascalCase + `Component` | `EmployesPageComponent` |
| Sélecteur | préfixe `app-` | `app-employes-page` |
| Fichier de routes produit | `<produit>.routes.ts` | `workspace.routes.ts` |
| Constante de routes | `<PRODUIT>_ROUTES` | `WORKSPACE_ROUTES` |
| Service | `<nom>.service.ts` → `<Nom>Service` | `employes.service.ts` |
| Fichier de mock | `src/mocks/data/<entite>.mock.ts` ou `.json` | `employes.mock.ts` |

- Noms de domaine en français (sans accents dans le code), libellés d'interface avec accents.
- Composants **standalone uniquement** : aucun `NgModule`.

## Structure d'un produit

```
src/app/products/<produit>/
├── <produit>.routes.ts
└── modules/
    └── <module>/
        ├── <module>-page.component.ts   # page routée
        ├── components/                  # composants propres au module (optionnel)
        ├── services/                    # accès aux données (optionnel)
        └── models/                      # interfaces TypeScript (optionnel)
```

Produits existants : `workspace`, `perf`, `job` (routés), `workflow`, `doc`, `payroll` (à venir).

## Créer un nouveau module

Exemple : module `contrats` dans le produit `workspace`.

```bash
npx ng generate component products/workspace/modules/contrats/contrats-page --flat
```

Ou créer le fichier à la main :

```ts
// src/app/products/workspace/modules/contrats/contrats-page.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-contrats-page',
  template: `<h1>Contrats</h1>`,
})
export class ContratsPageComponent {}
```

## Ajouter une route

### Route de module (dans un produit existant)

Dans `src/app/products/workspace/workspace.routes.ts` :

```ts
import { ContratsPageComponent } from './modules/contrats/contrats-page.component';

export const WORKSPACE_ROUTES: Routes = [
  // ...
  { path: 'contrats', component: ContratsPageComponent, title: 'Contrats' },
];
```

La page est alors accessible sur `/workspace/contrats`.

### Nouveau produit (lazy loading)

1. Créer `src/app/products/<produit>/<produit>.routes.ts` exportant `<PRODUIT>_ROUTES`.
2. Ajouter l'entrée dans `src/app/app.routes.ts` :

```ts
{
  path: 'payroll',
  loadChildren: () => import('./products/payroll/payroll.routes').then((m) => m.PAYROLL_ROUTES),
},
```

## Utiliser les mocks

Il n'y a pas de backend : `src/mocks/data/` joue le rôle d'API fictive partagée entre tous les produits.

1. Déclarer les données dans `src/mocks/data/` :

```ts
// src/mocks/data/employes.mock.ts
import { Employe } from '../../app/products/workspace/modules/employes/models/employe.model';

export const EMPLOYES: Employe[] = [
  { id: 1, nom: 'Diop', prenom: 'Awa', poste: 'Développeuse' },
];
```

2. Exposer les données via un service qui simule un appel HTTP :

```ts
import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { EMPLOYES } from '../../../../../../mocks/data/employes.mock';

@Injectable({ providedIn: 'root' })
export class EmployesService {
  getAll(): Observable<Employe[]> {
    return of(EMPLOYES).pipe(delay(200));
  }
}
```

3. Les composants consomment uniquement le service, jamais le fichier de mock directement. Le jour où une vraie API existe, seul le service change.

Les fichiers `.json` sont possibles (`resolveJsonModule` à activer dans `tsconfig.json`), mais les fichiers `.ts` typés sont préférés.
