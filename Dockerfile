# syntax=docker/dockerfile:1

FROM node:26-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM deps AS build
COPY . .
ARG DATABASE_URL=postgresql://bindrr:bindrr@postgres:5432/bindrr
ARG AUTH_SECRET=build-placeholder
ARG OPENEXCHANGERATES_APPID=build-placeholder
ARG CRON_SECRET=build-placeholder
ARG PUBLIC_SENTRY_DSN=
ENV HUSKY=0 \
  DOCKER_BUILD=1 \
  NEXT_TELEMETRY_DISABLED=1 \
  DATABASE_URL=$DATABASE_URL \
  AUTH_SECRET=$AUTH_SECRET \
  OPENEXCHANGERATES_APPID=$OPENEXCHANGERATES_APPID \
  CRON_SECRET=$CRON_SECRET \
  PUBLIC_SENTRY_DSN=$PUBLIC_SENTRY_DSN
RUN npm run build

FROM node:26-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
  HOSTNAME=0.0.0.0 \
  PORT=3000 \
  HUSKY=0 \
  HOME=/home/nextjs

RUN apt-get update \
  && apt-get install -y --no-install-recommends dumb-init \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs --create-home --home-dir /home/nextjs nextjs

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/drizzle.config.ts ./
COPY --from=build /app/src/lib/db/schema.ts ./src/lib/db/schema.ts
COPY --from=build /app/package-lock.json ./package-lock.json
COPY docker/entrypoint.sh ./docker/entrypoint.sh

# drizzle-kit is not included in Next.js standalone output
RUN npm install drizzle-kit --omit=dev --ignore-scripts \
  && chmod +x ./docker/entrypoint.sh \
  && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--", "./docker/entrypoint.sh"]
