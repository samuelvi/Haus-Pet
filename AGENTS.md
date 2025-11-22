# Repository Guidelines

## Project Structure & Modules
- Monorepo under `app/`: backend API + worker in `app/api` (DDD folders `domain/`, `application/`, `infrastructure/`, `routes/`, entries `index.ts` and `worker.ts`), frontend in `app/frontend` (React + Vite).
- Ops and docs live in `docker/` (dev/test/proxy Compose + nginx) and `docs/` (testing, schema, production guidance). Playwright specs are in `tests/functional`; artifacts land in `playwright-report/` and `test-results/`.
- Data layer: Prisma schema/migrations at `app/api/prisma/` (schemas public/eventstore/readmodels). Scripts/utilities in `app/api/scripts`.

## Build, Test, and Development Commands
```sh
# From repo root
npm run dev:api         # start API in watch mode (app/api)
npm run dev:worker      # start background worker (BullMQ) in app/api
npm run dev:frontend    # start React dev server (app/frontend)
npm run build:api       # type-check + compile API to dist/
make up | make down     # bring Docker stack up/down for local dev
make test               # spin up test stack, run Playwright in tests/functional, then clean up
```
In `app/api`: `npm run db:migrate`/`db:seed` manage Prisma migrations and seed data. Compose startup already runs `npm install`, `prisma generate`, `migrate deploy`, and `db seed`.

## Coding Style & Naming Conventions
- TypeScript everywhere; `app/api` uses `ts-node-dev` for dev and `tsc` for builds with `strict` mode on. No API lint script yet—rely on `npm run build` for type safety until a lint step is added.
- Prefer 2-space indentation, camelCase for functions/variables, PascalCase for types/classes, and kebab-case for files. Keep DDD separation (`domain` vs `application` vs `infrastructure`).
- Frontend linting uses the flat ESLint config in `app/frontend/eslint.config.js` (hooks + Vite rules). Run `npm run lint` in `app/frontend` before pushing UI changes.

## Testing Guidelines
- Playwright is configured via `playwright.config.ts` with tests under `tests/functional/**/*.spec.ts`; keep new specs close to the feature and use descriptive `describe`/`test` names.
- `make test` (or `npm run test:functional`) builds the isolated test stack, waits for the API, executes tests, and tears down containers. Include assertions for HTTP status, payload shape, and auth flows.
- Record new fixtures or test data via Prisma seeds when possible to keep specs deterministic.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (e.g., `feat: add pet search filter`, `fix: handle missing auth token`); header limit is relaxed to 200 chars via `commitlint.config.js`.
- PRs should include: short summary, linked issue/ticket, test results (mention `make test`), and screenshots/GIFs for UI changes. Note any config or migration steps (`npm run db:migrate`, `make up`) in the description.

## Documentation Pointers
- `docs/TESTING.md` covers the Docker-backed Playwright flow; `docs/SCHEMA-ORGANIZATION.md` explains the multi-schema Prisma layout; `docs/FUZZY-SEARCH.md` details the breed fuzzy matching layer; `docs/PRODUCTION.md` lists production deployment guidance (prod Dockerfiles are templates you must create).
