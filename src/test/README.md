# Tests

Database tests use `DATABASE_URL` from `.env.test` (not `.env`). Copy the example file and point it at a dedicated test database:

```bash
cp .env.test.example .env.test
npm run db:migrate
npm test
```

CI sets `DATABASE_URL` from an ephemeral Neon branch instead of `.env.test`.
