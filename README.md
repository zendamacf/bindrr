# bindrr 🎴

[![Tests](https://github.com/zendamacf/bindrr/actions/workflows/tests.yml/badge.svg)](https://github.com/zendamacf/bindrr/actions/workflows/tests.yml)

[bindrr.kalopsia.dev](https://bindrr.kalopsia.dev)

## Local development

```bash
cp .env.development.example .env   # set AUTH_SECRET, OPENEXCHANGERATES_APPID, CRON_SECRET, DATABASE_URL
npm ci
npm run db:migrate
npm run start:dev
```

## Docker

```bash
cp .env.example .env   # production Compose secrets (DB_PASSWORD, CRON_SECRET, …)
# Local/CI: build from source
docker compose -f docker-compose.yml -f docker-compose.ci.yml up --build
# Production: pull published image + cron sidecar
# APP_IMAGE=ghcr.io/zendamacf/bindrr:v3.0.0 docker compose --profile production up -d
```
