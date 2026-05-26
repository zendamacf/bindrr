import { describe, expect, it } from 'vitest';
import { apiRoutes, collectionApiUrl, routeMap, routes } from './routes';

describe('routes', () => {
  it('exposes a map of page and API paths', () => {
    expect(routeMap.pages).toEqual({
      home: '/',
      login: '/login',
      logout: '/logout',
      collection: '/collection',
      monitoring: '/monitoring',
    });
    expect(routeMap.api).toEqual({
      collection: '/api/collection',
      collectionSets: '/api/collection/sets',
    });
  });

  it('uses unique path values within each group', () => {
    expect(new Set(Object.values(routes)).size).toBe(Object.keys(routes).length);
    expect(new Set(Object.values(apiRoutes)).size).toBe(Object.keys(apiRoutes).length);
  });

  it('builds collection API URLs with query strings', () => {
    const params = new URLSearchParams({ page: '2', sort: 'name' });
    expect(collectionApiUrl(params)).toBe('/api/collection?page=2&sort=name');
    expect(collectionApiUrl()).toBe('/api/collection');
  });
});
