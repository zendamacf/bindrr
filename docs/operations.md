# Operations (self-hosting)

Guide for running Bindrr on a VPS with Docker Compose.

## Required secrets

Set these in `.env` next to `docker-compose.yml` (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `DB_PASSWORD` | Postgres password for the `bindrr` user |
| `AUTH_SECRET` | Session signing (32+ random bytes) |
| `OPENEXCHANGERATES_APPID` | OpenExchangeRates application id |
| `CRON_SECRET` | Bearer token for manual `/api/cron/*` HTTP triggers |
| `APP_IMAGE` | e.g. `ghcr.io/zendamacf/bindrr:v3.0.0` |
| `PUBLIC_SENTRY_DSN` | Optional error reporting |
| `PUBLIC_UMAMI_WEBSITE_ID` | Optional Umami website id (page views) |
| `PUBLIC_UMAMI_SCRIPT_URL` | Umami `script.js` URL on your instance (e.g. `https://umami.example.com/script.js`) |
| `APP_PORT` | Host port mapped to the app (default `3000`) |

Published images are built from git tags `v*` and pushed to GitHub Container Registry (`ghcr.io/zendamacf/bindrr:<tag>`).

## Deploy / upgrade

1. Pull the desired image tag (or build locally).
2. Update `APP_IMAGE` in `.env` if needed.
3. `docker compose pull` (when using published images).
4. `docker compose up -d`.
5. The app entrypoint runs `drizzle-kit migrate` before `node server.js`.

Verify:

```bash
curl -sf http://localhost:3000/health
```

## Health checks

- Compose defines a Docker healthcheck against `/health`.
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

## Umami analytics (optional)

When both `PUBLIC_UMAMI_WEBSITE_ID` and `PUBLIC_UMAMI_SCRIPT_URL` are set, the app loads your self-hosted Umami tracker for **page views** only. Umami respects browser Do Not Track (`data-do-not-track`). No analytics script is injected when these vars are unset. Umami receives page URLs and coarse visitor metrics—not collection contents or credentials.

## Reverse proxy

Terminate TLS in Caddy, nginx, or Traefik in front of `APP_PORT`. Forward `X-Forwarded-For` (or `X-Real-IP`) so client IP logging behaves correctly if you add proxy-level rate limits.

## Scheduled jobs

In production, the app registers UTC cron tasks in-process (see `src/lib/cron/scheduler.ts`):

- **03:00** — sync collection printing prices from Scryfall
- **14:00** — refresh OpenExchangeRates fiat rates

Run **one** app instance with the scheduler enabled. Multiple replicas would fire duplicate schedules unless you disable in-process cron on all but one instance.

Manual or CI triggers can still call the HTTP endpoints with `Authorization: Bearer <CRON_SECRET>` (no session cookie; cron paths are exempt from auth middleware):

- `GET` or `POST` `/api/cron/sync-prices`
- `GET` or `POST` `/api/cron/update-rates`
