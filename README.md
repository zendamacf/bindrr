# bindrr 🎴

[![Tests](https://github.com/zendamacf/bindrr/actions/workflows/tests.yml/badge.svg)](https://github.com/zendamacf/bindrr/actions/workflows/tests.yml)

Track your Magic: The Gathering collection with live Scryfall prices, multi-currency totals, price history charts, and scheduled price sync.

- **Live demo:** [bindrr.kalopsia.dev](https://bindrr.kalopsia.dev)
- **Container images:** `ghcr.io/zendamacf/bindrr` (tags match git releases, e.g. `v3.0.0`, `latest`)

## Features

- Email/password login (self-hosted; no public sign-up UI)
- Search Scryfall to add printings with nonfoil / foil / etched finishes
- Sort, filter, and paginate your collection
- Preferred display currency with OpenExchangeRates-backed conversion
- Scheduled exchange-rate and price sync jobs (in-process in Docker; HTTP cron endpoints for manual runs)
- Optional Sentry error reporting and Umami page-view analytics (self-hosted)

## Documentation

| Topic | Guide |
| --- | --- |
| Architecture & data flow | [docs/architecture.md](docs/architecture.md) |
| Self-hosting, backups, upgrades | [docs/operations.md](docs/operations.md) |
| Local dev & testing | [docs/development.md](docs/development.md) |
| Contributing & releases | [docs/contributing.md](docs/contributing.md) |

## Quick start (local)

```bash
cp .env.development.example .env   # AUTH_SECRET, OPENEXCHANGERATES_APPID, CRON_SECRET, DATABASE_URL
npm ci
npm run db:migrate
npm run start:dev
```

Create a user before logging in — see [Creating users](docs/operations.md#creating-users).

## Docker (production-style)

```bash
cp .env.example .env   # DB_PASSWORD, AUTH_SECRET, OPENEXCHANGERATES_APPID, CRON_SECRET, APP_IMAGE
# Local/CI: build from source
docker compose -f docker-compose.yml -f docker-compose.ci.yml up --build
# Production: pull a release image
APP_IMAGE=ghcr.io/zendamacf/bindrr:v3.0.0 docker compose up -d
```

Health check: `GET /health` → `ok`. The app container runs migrations on startup (`docker/entrypoint.sh`).
