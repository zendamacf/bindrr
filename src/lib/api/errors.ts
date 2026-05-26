import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export type ApiErrorContext = {
  route: string;
  method?: string;
  userId?: number;
};

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function logApiError(error: unknown, context: ApiErrorContext): void {
  const err = toError(error);
  console.error(`[api] ${context.method ?? 'GET'} ${context.route} failed`, {
    ...context,
    error: err.message,
    stack: err.stack,
  });

  if (process.env.NODE_ENV === 'development') return;

  Sentry.captureException(err, { extra: context });
}

export function apiInternalErrorResponse(
  clientMessage: string,
  error: unknown,
  context: ApiErrorContext,
): NextResponse {
  logApiError(error, context);
  return NextResponse.json({ error: clientMessage }, { status: 500 });
}
