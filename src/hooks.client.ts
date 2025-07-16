import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import * as Sentry from '@sentry/sveltekit';
import { handleErrorWithSentry } from '@sentry/sveltekit';

Sentry.init({
  dsn: env.PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: dev ? 'development' : 'production',
});

export const handleError = handleErrorWithSentry();
