export async function register() {
  if (process.env.NODE_ENV === 'development') return;

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

type CaptureRequestError = typeof import('@sentry/nextjs').captureRequestError;

export const onRequestError: CaptureRequestError = (...args) => {
  if (process.env.NODE_ENV === 'development') return;
  return import('@sentry/nextjs').then(({ captureRequestError }) => captureRequestError(...args));
};
