export type RateLimitPolicy = {
  maxAttempts: number;
  windowMs: number;
};

export type RateLimitConfig = {
  login: RateLimitPolicy;
  search: RateLimitPolicy;
  apiAuthenticated: RateLimitPolicy;
  apiAnonymous: RateLimitPolicy;
};

/** Sliding-window limits (per key). In-memory; suitable for a single app instance. */
export const rateLimitConfig: RateLimitConfig = {
  login: {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
  },
  search: {
    maxAttempts: 60,
    windowMs: 60 * 1000,
  },
  apiAuthenticated: {
    maxAttempts: 300,
    windowMs: 60 * 1000,
  },
  apiAnonymous: {
    maxAttempts: 60,
    windowMs: 60 * 1000,
  },
};

export function getRateLimitConfig(): RateLimitConfig {
  return rateLimitConfig;
}
