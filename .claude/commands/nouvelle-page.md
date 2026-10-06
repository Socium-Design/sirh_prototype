---
description: Réaliser une page ou une fonctionnalité du prototype à partir d'une spec
argument-hint: <spec, ou chemin/lien vers la spec>
---

Spec à réaliser : $ARGUMENTS

Déroule le workflow « De la spec à la page » de `CLAUDE.md`, dans l'ordre, sans sauter d'étape :

1. Relis `CLAUDE.md` et `docs/design-system.md`. Reformule la spec en quelques lignes (produit, module, type de page, données,
   actions) et signale tout point ambigu **avant** de coder.
2. Vérifie ce qui existe déjà (`src/app/products/`, `src/app/core/navigation/navigation.map.ts`, `src/mocks/data/`).
3. Crée la branche `feature/<produit>-<module>` si elle n'existe pas.
4. Choisis le template de page du kit, puis lis dans `node_modules/@socium-design/angular-components/docs/generated/components.md`
   la section de **chaque** composant que tu comptes utiliser (Grep sur le nom). Ne devine aucune prop.
5. Écris : modèle, mock (`src/mocks/data/`), service, page, route lazy, entrée dans `navigation.map.ts`. Tout besoin non couvert par
   le kit est un `GAP-DS` à lister, jamais un faux composant.
6. Écris le test de la page (modèle : `employes-page.component.spec.ts`).
7. Vérifie : `npm run build`, `npm run test:ci`, puis lance `npm start` et contrôle la page dans le navigateur (actions, recherche,
   pagination, états vides, console sans erreur). Corrige jusqu'à ce que tout soit réellement bon.
8. Commit `<Produit> > <Module> : description`. Résume : fichiers créés, `GAP-DS` rencontrés, décisions à valider.
