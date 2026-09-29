/** Sliding-window limits (per key). In-memory; suitable for a single app instance. */
export const rateLimitConfig = {
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
} as const;

export function getRateLimitConfig() {
  return rateLimitConfig;
}
