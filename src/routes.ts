/**
 * Canonical application paths. Import from here instead of string literals.
 */
export const routes = {
  home: '/',
  login: '/login',
  logout: '/logout',
  collection: '/collection',
  /** Sentry tunnel (see next.config.ts). */
  monitoring: '/monitoring',
} as const;

export const apiRoutes = {
  collection: '/api/collection',
  collectionSets: '/api/collection/sets',
  cronUpdateRates: '/api/cron/update-rates',
} as const;

export const routeMap = {
  pages: routes,
  api: apiRoutes,
} as const;

export type PageRoute = (typeof routes)[keyof typeof routes];
export type ApiRoute = (typeof apiRoutes)[keyof typeof apiRoutes];

export function collectionApiUrl(searchParams?: URLSearchParams): string {
  const base = apiRoutes.collection;
  if (!searchParams || searchParams.size === 0) return base;
  return `${base}?${searchParams.toString()}`;
}
