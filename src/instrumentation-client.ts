// Client Sentry init and router hooks are skipped in development for faster compiles.

export function onRouterTransitionStart(
  ...args: Parameters<typeof import('@sentry/nextjs').captureRouterTransitionStart>
) {
  if (process.env.NODE_ENV === 'development') return;
  void import('@sentry/nextjs').then(({ captureRouterTransitionStart }) => {
    captureRouterTransitionStart(...args);
  });
}

if (process.env.NODE_ENV !== 'development') {
  void import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn: 'https://178be22980cffea8c8e6fa1d0afed070@o4509541345591296.ingest.de.sentry.io/4509677053870160',
      tracesSampleRate: 1,
      debug: false,
    });
  });
}
