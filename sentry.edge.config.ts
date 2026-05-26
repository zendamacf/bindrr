import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  debug: false,
});
