import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import * as Sentry from '@sentry/sveltekit';
import { handleErrorWithSentry, sentryHandle } from '@sentry/sveltekit';
import { sequence } from '@sveltejs/kit/hooks';

Sentry.init({
  dsn: env.PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: dev ? 'development' : 'production',
});

export const handle = sequence(sentryHandle());
export const handleError = handleErrorWithSentry();
