function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/** Sliding-window limits (per key). Override via env for self-hosted tuning. */
export function getRateLimitConfig() {
  return {
    login: {
      maxAttempts: readPositiveInt('RATE_LIMIT_LOGIN_MAX', 10),
      windowMs: readPositiveInt('RATE_LIMIT_LOGIN_WINDOW_MS', 15 * 60 * 1000),
    },
    search: {
      maxAttempts: readPositiveInt('RATE_LIMIT_SEARCH_MAX', 60),
      windowMs: readPositiveInt('RATE_LIMIT_SEARCH_WINDOW_MS', 60 * 1000),
    },
    apiAuthenticated: {
      maxAttempts: readPositiveInt('RATE_LIMIT_API_AUTH_MAX', 300),
      windowMs: readPositiveInt('RATE_LIMIT_API_AUTH_WINDOW_MS', 60 * 1000),
    },
    apiAnonymous: {
      maxAttempts: readPositiveInt('RATE_LIMIT_API_ANON_MAX', 60),
      windowMs: readPositiveInt('RATE_LIMIT_API_ANON_WINDOW_MS', 60 * 1000),
    },
  };
}
