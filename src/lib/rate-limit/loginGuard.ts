import { headers } from 'next/headers';
import { getClientIpFromHeaders } from './clientIp';
import { getRateLimitConfig } from './config';
import { consumeRateLimit } from './store';

export class RateLimitError extends Error {
  readonly retryAfterSec: number;

  constructor(retryAfterSec: number) {
    super('Too many login attempts. Please try again later.');
    this.name = 'RateLimitError';
    this.retryAfterSec = retryAfterSec;
  }
}

export async function assertLoginRateLimit(email: string): Promise<void> {
  const headerStore = await headers();
  const ip = getClientIpFromHeaders(headerStore);
  const normalizedEmail = email.trim().toLowerCase();
  const { maxAttempts, windowMs } = getRateLimitConfig().login;

  const ipResult = consumeRateLimit(`login:ip:${ip}`, maxAttempts, windowMs);
  if (!ipResult.allowed) {
    throw new RateLimitError(ipResult.retryAfterSec);
  }

  if (normalizedEmail) {
    const emailResult = consumeRateLimit(`login:email:${normalizedEmail}`, maxAttempts, windowMs);
    if (!emailResult.allowed) {
      throw new RateLimitError(emailResult.retryAfterSec);
    }
  }
}
