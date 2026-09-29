# Operations (self-hosting)

Guide for running Bindrr on a VPS with Docker Compose.

## Required secrets

Set these in `.env` next to `docker-compose.yml` (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `DB_PASSWORD` | Postgres password for the `bindrr` user |
| `AUTH_SECRET` | Session signing (32+ random bytes) |
| `OPENEXCHANGERATES_APPID` | OpenExchangeRates application id |
| `CRON_SECRET` | Bearer token for `/api/cron/*` |
| `APP_IMAGE` | e.g. `ghcr.io/zendamacf/bindrr:v3.0.0` |
| `PUBLIC_SENTRY_DSN` | Optional error reporting |
| `APP_PORT` | Host port mapped to the app (default `3000`) |

Published images are built from git tags `v*` and pushed to GitHub Container Registry (`ghcr.io/zendamacf/bindrr:<tag>`).

## Deploy / upgrade

1. Pull the desired image tag (or build locally).
2. Update `APP_IMAGE` in `.env` if needed.
3. `docker compose --profile production pull` (when using published images).
4. `docker compose --profile production up -d`.
5. The app entrypoint runs `drizzle-kit migrate` before `node server.js`.

Verify:

```bash
curl -sf http://localhost:3000/health
```

## Health checks

- Compose defines a Docker healthcheck against `/health`.
- Cron sidecar waits until the app is healthy before scheduling jobs.

## Creating users

Bindrr does not expose a sign-up page. Create users with SQL against your Postgres volume.

Generate a bcrypt hash (cost 10+ recommended for production):

```bash
node -e "import('bcryptjs').then(b => b.hash('your-password', 10).then(console.log))"
```

Insert (email is case-insensitive unique):

```sql
INSERT INTO users (email, password_hash, preferred_currency_code)
VALUES ('you@example.com', '<bcrypt-hash>', 'USD');
```

Then log in at `/login`.

## Backups

All persistent state lives in the **`pgdata`** Docker volume (`docker-compose.yml`). Back it up regularly.

Example logical dump while the stack is running:

```bash
docker compose exec -T postgres pg_dump -U bindrr bindrr | gzip > bindrr-$(date +%F).sql.gz
```

Restore to a fresh volume (destructive — test on a staging host first):

```bash
gunzip -c bindrr-2026-01-01.sql.gz | docker compose exec -T postgres psql -U bindrr bindrr
```

Also store a copy of your `.env` secrets in a secure password manager.

## Reverse proxy

Terminate TLS in Caddy, nginx, or Traefik in front of `APP_PORT`. Forward `X-Forwarded-For` (or `X-Real-IP`) so client IP logging behaves correctly if you add proxy-level rate limits.

## Cron

With `--profile production`, the Alpine cron container calls:

- `cron-sync-prices.sh` → `/api/cron/sync-prices`
- `cron-update-rates.sh` → `/api/cron/update-rates`

Scripts read `CRON_SECRET` from the environment. Adjust schedules in `docker/crontab` if needed.
