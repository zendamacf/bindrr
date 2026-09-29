# Development

## Environment files

| File | Used for |
| --- | --- |
| `.env` | Local `npm run start:dev`, `db:migrate` (copy from `.env.development.example`) |
| `.env.test` | Integration tests only (copy from `.env.test.example`) |

Integration tests **do not** read `.env`. Vitest loads `.env.test` via the integration setup.

## Commands

```bash
npm ci
npm run db:migrate      # apply Drizzle migrations
npm run start:dev       # Next.js dev server (Turbopack)
npm run lint            # Biome
npm run typecheck       # tsc
npm test                # Vitest unit + integration
npm run test:coverage   # coverage thresholds (server/lib code)
```

## Unit vs integration tests

- **Unit** (`vitest.unit.config.ts`): mocked dependencies, parallel.
- **Integration** (`vitest.integration.config.ts`): real Postgres, serial execution, shared `DATABASE_URL`.

See [src/test/README.md](../src/test/README.md) for database setup.

## End-to-end tests

Playwright specs live under `e2e/` (see `e2e/README.md` when present on your branch). They require a migrated database and `npm run e2e:seed`.

## Database tooling

```bash
npm run db:generate   # new migration from schema changes
npm run db:migrate    # apply migrations
```

`drizzle.config.ts` reads `DATABASE_URL` from the environment.
