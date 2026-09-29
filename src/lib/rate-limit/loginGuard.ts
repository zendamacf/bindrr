import { headers } from 'next/headers';
import { getClientIpFromHeaders } from './clientIp';
import { getRateLimitConfig } from './config';
import { consumeRateLimit, peekRateLimit } from './store';

export class RateLimitError extends Error {
  readonly retryAfterSec: number;

  constructor(retryAfterSec: number) {
    super('Too many login attempts. Please try again later.');
    this.name = 'RateLimitError';
    this.retryAfterSec = retryAfterSec;
  }
}

function throwIfBlocked(result: { allowed: boolean; retryAfterSec: number }): void {
  if (!result.allowed) {
    throw new RateLimitError(result.retryAfterSec);
  }
}

/** Block login when prior failed attempts exceeded the limit (does not consume a slot). */
export async function ensureLoginNotRateLimited(email: string): Promise<void> {
  const headerStore = await headers();
  const ip = getClientIpFromHeaders(headerStore);
  const normalizedEmail = email.trim().toLowerCase();
  const { maxAttempts, windowMs } = getRateLimitConfig().login;

  if (ip !== 'unknown') {
    throwIfBlocked(peekRateLimit(`login:ip:${ip}`, maxAttempts, windowMs));
  }

  if (normalizedEmail) {
    throwIfBlocked(peekRateLimit(`login:email:${normalizedEmail}`, maxAttempts, windowMs));
  }
}

/** Record a failed login attempt (invalid credentials). */
export async function recordFailedLoginAttempt(email: string): Promise<void> {
  const headerStore = await headers();
  const ip = getClientIpFromHeaders(headerStore);
  const normalizedEmail = email.trim().toLowerCase();
  const { maxAttempts, windowMs } = getRateLimitConfig().login;

  if (ip !== 'unknown') {
    consumeRateLimit(`login:ip:${ip}`, maxAttempts, windowMs);
  }

  if (normalizedEmail) {
    consumeRateLimit(`login:email:${normalizedEmail}`, maxAttempts, windowMs);
  }
}
