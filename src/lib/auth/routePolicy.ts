import { apiRoutes, routes } from '@/routes';

/** Cookie name for the session JWT (must match `src/utils/auth/session.ts`). */
export const SESSION_COOKIE_NAME = 'session';

/**
 * Paths that never require a session. Everything else matched by `authMiddlewareMatcher`
 * is protected at the edge before handlers run.
 */
const PUBLIC_PAGE_PREFIXES = [routes.login, routes.logout, '/health', routes.monitoring] as const;

const PUBLIC_API_PREFIXES = ['/api/cron'] as const;

export function isPublicPath(pathname: string): boolean {
  if (
    PUBLIC_PAGE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  ) {
    return true;
  }
  return PUBLIC_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Page and API paths that should run through auth middleware when not public. */
const PROTECTED_PAGE_PATHS = [routes.home, routes.collection] as const;

const PROTECTED_API_PREFIXES = ['/api/collection', '/api/cards', '/api/user'] as const;

export function pathRequiresSession(pathname: string): boolean {
  if (isPublicPath(pathname)) return false;

  if (PROTECTED_PAGE_PATHS.some((path) => pathname === path)) {
    return true;
  }

  return PROTECTED_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Next.js middleware matcher entries. Keep in sync with {@link pathRequiresSession}.
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
 */
export const authMiddlewareMatcher = [
  '/',
  routes.collection,
  `${apiRoutes.collection}/:path*`,
  '/api/cards/:path*',
  '/api/user/:path*',
];
