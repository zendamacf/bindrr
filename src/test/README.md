# Tests

Vitest runs two projects: **unit** tests (mocked deps, parallel) and **integration** tests (real Postgres, serial).

Integration tests use `DATABASE_URL` from `.env.test` (not `.env`). Copy the example file and point it at a dedicated test database:

```bash
cp .env.test.example .env.test
npm run db:migrate
npm test
```

A local Docker Postgres 18 instance works well:

```bash
docker run --name bindrr-test-db -e POSTGRES_USER=bindrr -e POSTGRES_PASSWORD=bindrr -e POSTGRES_DB=bindrr -p 5432:5432 -d postgres:18
# DATABASE_URL=postgresql://bindrr:bindrr@localhost:5432/bindrr
```

## CI

GitHub Actions (`.github/workflows/tests.yml`) runs:

- **test** — Postgres 18 service container, migrations, `npm run test:coverage`, Codecov upload
- **deploy-smoke** — Docker Compose build, `/health`, login HTML, cron auth checks
Neon is not part of the current CI workflow; all automated tests use the in-job Postgres service.
