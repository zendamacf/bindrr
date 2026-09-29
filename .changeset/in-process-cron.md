---
"bindrr": minor
---

Run price sync and exchange-rate updates on an in-process UTC scheduler in Docker deployments. The Alpine cron Compose service is removed; HTTP `/api/cron/*` endpoints remain for manual triggers.
