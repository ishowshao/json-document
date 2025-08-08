# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Vue 3 component library source. Key modules: `components/JsonDocument.vue`, `components/EditableField.vue`, `stores/document.js`, `utils/schema.js`.
- `docs/`: Usage and local development guides (e.g., `LIB_USAGE.md`, `LOCAL_DEVELOPMENT.md`).
- `e2e/`: Playwright tests (`*.spec.js`).
- `dist/`: Built library outputs (`*.es.js`, `*.cjs.js`, `index.d.ts`, CSS).
- Entry points: `src/index.js` (runtime), `src/index.d.ts` (types).

## Build, Test, and Development Commands
- `npm run dev`: Start Vite dev server for playground at `http://localhost:5173`.
- `npm run build`: Build site/demo via Vite.
- `npm run build:lib`: Build the library using `vite.lib.config.js` (updates `dist/`).
- `npm run preview`: Preview built site (CI uses port 4173).
- `npm run test:unit`: Run Vitest (jsdom) unit tests.
- `npm run test:e2e`: Run Playwright tests (first run: `npx playwright install`).
- `npm run format`: Format `src/` with Prettier.
- Local linking: `npm run link:global` / `npm run unlink:global` (see `docs/LOCAL_DEVELOPMENT.md`).

## Coding Style & Naming Conventions
- Prettier: no semicolons, single quotes, print width 100; run `npm run format`.
- Indentation: 2 spaces; keep `<script setup>` and `<template>` tidy.
- Vue components: PascalCase filenames (`JsonDocument.vue`); props/events in kebab-case at call sites.
- Variables and functions: `camelCase`; constants `SCREAMING_SNAKE_CASE` only when truly constant.

## Testing Guidelines
- Unit: Vitest with `environment: 'jsdom'`. Place `*.spec.{js,ts}` near the code they test.
- E2E: Playwright under `e2e/`; tests start a dev/preview server per `playwright.config.js`.
- Aim to cover core behaviors: JSONPath mapping, inline editing, preview accept/reject, array add/remove.

## Commit & Pull Request Guidelines
- Commits: follow Conventional Commits (e.g., `feat(layout): ...`, `fix: ...`, `docs: ...`).
- PRs: include clear description, linked issues, test plan (commands + results), and screenshots/GIFs for UI changes.
- Keep changes scoped; update docs and types when public APIs change.

## Security & Configuration Tips
- Peer deps: ensure apps install `vue@^3.5` and `pinia@^3`.
- Styles: import `vue-json-document/dist/style.css` from consumers.
- Publishing: `prepublishOnly` builds the library; do not edit `dist/` manually.
