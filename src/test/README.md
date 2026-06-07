# Tests

Vitest runs two projects: **unit** tests (mocked deps, parallel) and **integration** tests (real Postgres, serial).

Integration tests use `DATABASE_URL` from `.env.test` (not `.env`). Copy the example file and point it at a dedicated test database:

```bash
cp .env.test.example .env.test
npm run db:migrate
npm test
```

A local Docker Postgres works well:

```bash
docker run --name bindrr-test-db -e POSTGRES_USER=bindrr -e POSTGRES_PASSWORD=bindrr -e POSTGRES_DB=bindrr -p 5432:5432 -d postgres:16
# DATABASE_URL=postgresql://bindrr:bindrr@localhost:5432/bindrr
```

CI runs migrations and tests against a Postgres service container. Neon is still used to create a preview branch and post schema diffs against production; it is not used as the test database.
