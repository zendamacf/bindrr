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
    expect(routeMap.api).toMatchObject({
      cardSearch: '/api/cards/search',
      collection: '/api/collection',
      collectionAdd: '/api/collection/add',
      collectionSets: '/api/collection/sets',
      cronUpdateRates: '/api/cron/update-rates',
    });
    expect(apiRoutes.collectionItem(42)).toBe('/api/collection/42');
    expect(apiRoutes.collectionItemScryfall(42)).toBe('/api/collection/42/scryfall');
  });

  it('uses unique path values within each group', () => {
    expect(new Set(Object.values(routes)).size).toBe(Object.keys(routes).length);
    const apiPathValues = Object.values(apiRoutes).filter((v) => typeof v === 'string');
    expect(new Set(apiPathValues).size).toBe(apiPathValues.length);
  });

  it('builds collection API URLs with query strings', () => {
    const params = new URLSearchParams({ page: '2', sort: 'name' });
    expect(collectionApiUrl(params)).toBe('/api/collection?page=2&sort=name');
    expect(collectionApiUrl()).toBe('/api/collection');
  });
});
