# Rate limiting

Bindrr applies in-memory, per-process rate limits suitable for a single self-hosted instance. If you run multiple app replicas behind a load balancer, use your reverse proxy for coarse limits or add a shared store (for example Redis).

## Limits

| Scope | Key | Limit | Window |
| --- | --- | --- | --- |
| Login | Client IP and email | 10 attempts | 15 minutes |
| Card search (`/api/cards/search`) | Authenticated user | 60 requests | 1 minute |
| Collection & preferences APIs | Authenticated user | 300 requests | 1 minute |
| Unauthenticated API calls | Client IP | 60 requests | 1 minute |

Cron routes (`/api/cron/*`) remain protected by `CRON_SECRET` and are not rate limited in the app.

Clients receive HTTP **429** with a JSON error body and a `Retry-After` header (seconds).

## Reverse proxy

For VPS deployments you can add complementary limits in Caddy or nginx (for example per-IP connection limits on `/login` and `/api/*`). App-level limits still apply per-user rules on search and authenticated APIs.
