# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

bindrr: a self-hosted Magic: The Gathering collection tracker (Next.js App Router + PostgreSQL via Drizzle). Scryfall supplies card data and prices; OpenExchangeRates supplies fiat rates. Deeper docs live in `docs/` (`architecture.md`, `development.md`, `operations.md`, `csv-import.md`, `rate-limiting.md`).

## Commands

```bash
npm ci
cp .env.development.example .env   # local dev env (needs DATABASE_URL, AUTH_SECRET, CRON_SECRET, OPENEXCHANGERATES_APPID)
npm run db:migrate                 # apply Drizzle migrations
npm run start:dev                  # Next dev server (Turbopack)
npm run lint                       # Biome check (lint:fix to autofix; also run by the husky pre-commit hook)
npm run typecheck                  # tsc --noEmit
npm test                           # Vitest, unit + integration projects
npm run test:coverage              # enforces coverage thresholds (what CI runs)
npm run db:generate                # generate a migration after editing src/lib/db/schema.ts
npm run changeset                  # add a changeset for user-visible changes
```

Run a single test: `npx vitest run src/lib/collection/finish.test.ts` (add `-t "name"` to filter by test name).

## Testing

- Two Vitest projects: **unit** (mocked deps, parallel) and **integration** (real Postgres, serial). Integration files are an explicit allowlist, `integrationTestFiles` in `vitest.shared.ts`. **A new test that touches the DB must be added to that list**, otherwise it runs as a unit test without DB setup.
- Integration tests read `DATABASE_URL` from `.env.test` (copy `.env.test.example`), not `.env`. Migrate that database first (`npm run db:migrate` with that URL), e.g. a local Postgres 18 container (see `src/test/README.md`).
- Coverage thresholds are enforced on server/lib code (excludes `src/lib/db/**` and the Scryfall client / exchange-rate updater); don't add untested logic to `src/lib`.

## Architecture

- **Layout**: `src/app` (pages + `/api/*` route handlers, each with a colocated `route.test.ts`), `src/actions` (server actions, auth), `src/components` (Mantine UI), `src/lib/<domain>` (business logic: `collection`, `wishlist`, `scryfall`, `exchange-rates`, `currency`, `cron`, `cache`, `rate-limit`, `analytics`, `db`), `src/utils`. Route handlers stay thin; logic and DB queries live in `src/lib`. Import via the `@/` alias.
- **Routes**: use `src/routes.ts` instead of string literals for paths.
- **Auth**: no sign-up flow; users are inserted directly in the DB. Sessions are signed HTTP-only cookies (`AUTH_SECRET`, `jose`). `src/middleware.ts` (edge) enforces sessions using the policy in `src/lib/auth/routePolicy.ts`; update that policy when adding protected pages/APIs. `/api/cron/*` is public at the middleware layer and each handler must itself verify `Authorization: Bearer <CRON_SECRET>` (`src/lib/cron/verifyCronSecret.ts`).
- **Scheduled jobs**: `src/instrumentation.ts` starts an in-process `node-cron` scheduler (`src/lib/cron/scheduler.ts`) in production Node runtime only (not in dev). It shares job logic (`src/lib/cron/jobs.ts`) with the `/api/cron/sync-prices` and `/api/cron/update-rates` HTTP routes. Price sync covers printings in both collections and wishlists.
- **Database**: schema in `src/lib/db/schema.ts`; migrations in `drizzle/` are generated (never hand-edit the snapshots/journal). The Docker entrypoint runs migrations on startup.
- **Caching**: `src/lib/cache/*` holds cached reads (card sets, exchange rates, price trends, Scryfall data) with matching `invalidate*` helpers; invalidate after writes that affect them.
- **Client data**: TanStack Query on the client; collection query keys are in `src/lib/collection/query-keys.ts`.
- **Observability**: Sentry (optional, `PUBLIC_SENTRY_DSN`) and Umami events (`src/lib/analytics`) are optional and must degrade gracefully when unconfigured.

## Workflow notes

- Add a changeset (`npm run changeset`) for user-visible changes; the package version/CHANGELOG are managed by Changesets.
- Style is enforced by Biome (single quotes, etc.); run `npm run lint:fix` rather than formatting by hand.

## Commit format

Conventional Commits, as seen in recent history (not enforced by tooling): `type(scope): lowercase imperative summary (#PR)`, e.g. `feat(wishlist): page and add-to-wishlist flow (#132) (#192)`. Types in use: `feat`, `fix`, `chore` (`chore(deps): ...` for dependency bumps, `chore: release X.Y.Z` for releases), `docs`. Scope is the feature area (`collection`, `wishlist`, `ui`, ...) and is optional. Reference the issue and/or PR number in parentheses at the end. Older history has unscoped commits; use the scoped format for new ones.
