# SIRH Prototype

Prototype de **Système d'Information des Ressources Humaines (SIRH)** développé par **Socium Design** avec **Angular 19**.

Il sert à explorer et valider les fonctionnalités clés d'un SIRH avant un développement à plus grande échelle. Les données sont fictives (`src/mocks/data/`). Toute l'interface est construite avec le design system Socium (`@socium-design/angular-components`).

## Produits

- **Workspace** (`/workspace`) : postes, compétences, employés, carrières
- **Perf** (`/perf`) : formation, évaluation, objectifs
- **Job** (`/job`) : offres
- À venir : workflow, doc, payroll (une page « bientôt disponible » s'affiche en attendant)

## Prérequis

- Node.js 20 ou plus récent, npm, Git, VS Code
- Un accès à l'organisation GitHub **Socium-Design** (le dépôt et le design system sont privés)
- Un jeton GitHub pour installer le design system — voir ci-dessous

## Installation

```bash
git clone git@github.com:Socium-Design/sirh_prototype.git   # ou l'URL HTTPS
cd sirh_prototype
```

Le design system est un paquet **privé** sur GitHub Packages. Une seule fois par machine, ajouter ton jeton dans `~/.npmrc`
(fichier personnel, hors dépôt — ne jamais le committer) :

```
//npm.pkg.github.com/:_authToken=TON_JETON_GITHUB
```

Le jeton est un *Personal access token (classic)* avec la permission `read:packages`
(GitHub → Settings → Developer settings → Personal access tokens). Si l'organisation utilise le SSO, l'autoriser pour Socium-Design.
Le détail pas à pas est dans [`docs/guide-equipe.pdf`](docs/guide-equipe.pdf).

```bash
npm install
```

## Déploiement Vercel

Vercel n'a pas votre jeton : ajouter dans le projet Vercel la variable d'environnement `NPM_RC` (jeton `read:packages`, deux lignes `@socium-design:registry=…` et `//npm.pkg.github.com/:_authToken=…`). Détail : section 9.4 du guide PDF. Ne jamais mettre le jeton dans le `.npmrc` du dépôt.

## Lancement

```bash
npm start          # serveur de dev sur http://localhost:4200
npm run build      # build de production dans dist/sirh-prototype/
npm run test:ci    # tests en headless (npm test = mode watch dans Chrome)
```

## Travailler avec Claude Code

Le dépôt est préconfiguré (`CLAUDE.md`, `.claude/`). Dans le dossier du projet : `claude`, puis par exemple
`/nouvelle-page <spec>` — Claude lit le design system, écrit la page, la branche au menu, la teste et la vérifie dans le navigateur.

## Documentation

- [Guide d'installation et de prise en main de l'équipe (PDF)](docs/guide-equipe.pdf)
- [Guidelines de développement](docs/guidelines.md)
- [Utiliser le design system](docs/design-system.md)

## Équipe

Socium Design
