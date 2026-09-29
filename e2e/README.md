# End-to-end tests (Playwright)

Browser tests cover login, collection browsing, card search UI (with mocked `/api/cards/search`), quantity edits, change history, and currency preferences.

## Prerequisites

- Postgres with migrations applied (`npm run db:migrate`)
- `DATABASE_URL`, `AUTH_SECRET`, `OPENEXCHANGERATES_APPID`, and `CRON_SECRET` set (same as local dev)

## Run locally

```bash
npm run e2e:seed    # creates e2e@bindrr.test user + sample collection
npm run build
npm run e2e         # starts `npm run start` unless PLAYWRIGHT_SKIP_WEBSERVER=1
```

CI runs the `e2e` job in `.github/workflows/tests.yml` after seeding the database.
