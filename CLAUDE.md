# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

SIRH (Système d'Information des Ressources Humaines) prototype for **Socium Design**, built with **Angular 19** (standalone components, SCSS, no SSR). The goal is to explore and validate core HR features before a larger build. There is no real backend: all data comes from mocks in `src/mocks/data/`.

## Commands

- `npm install` — install dependencies
- `npm start` — dev server on http://localhost:4200
- `npm run build` — production build into `dist/sirh-prototype/`
- `npm run watch` — development build in watch mode

Unit tests are not set up (project generated with `--skip-tests`).

## Architecture

The app is split into **products**, each lazy-loaded from `src/app/app.routes.ts` via `loadChildren`. Each product owns a `<product>.routes.ts` exporting `<PRODUCT>_ROUTES` and a `modules/` folder with one sub-folder per functional module.

```
src/
├── mocks/data/               # shared fake backend (JSON / TS)
└── app/
    ├── app.component.ts      # shell: nav + <router-outlet>
    ├── app.config.ts         # providers (router)
    ├── app.routes.ts         # '' → /workspace, lazy products
    └── products/
        ├── workspace/        # /workspace : postes, competences, employes, carrieres
        ├── perf/             # /perf      : formation, evaluation, objectifs
        ├── job/              # /job       : offres
        ├── workflow/modules/ # not routed yet
        ├── doc/modules/      # not routed yet
        └── payroll/modules/  # not routed yet
```

Each module currently has a placeholder page component: `modules/<module>/<module>-page.component.ts` → `<Module>PageComponent`.

## Conventions

- **Standalone components only** — never create an `NgModule`.
- **Lazy loading per product**: a new product gets its own `*.routes.ts` and one `loadChildren` entry in `app.routes.ts`; modules are plain routes inside their product's routes file.
- **Fake data lives in `src/mocks/data/`**, accessed through services — components never import mock files directly.
- File/folder names in kebab-case, French domain names without accents (`employes`, `competences`); UI labels keep accents.
- Detailed conventions: `docs/guidelines.md`.
- Project documentation (README, docs/) is written in French; keep user-facing docs in French.
- Remote: `origin` → `https://github.com/Socium-Design/sirh_prototype.git` (private), default branch `main`.
