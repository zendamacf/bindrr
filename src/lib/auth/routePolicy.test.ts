import { describe, expect, it } from 'vitest';
import { apiRoutes, routes } from '@/routes';
import { authMiddlewareMatcherForTests, isPublicPath, pathRequiresSession } from './routePolicy';

describe('routePolicy', () => {
  it('treats login, logout, health, monitoring, and cron APIs as public', () => {
    expect(isPublicPath(routes.login)).toBe(true);
    expect(isPublicPath(routes.logout)).toBe(true);
    expect(isPublicPath('/health')).toBe(true);
    expect(isPublicPath(routes.monitoring)).toBe(true);
    expect(isPublicPath(apiRoutes.cronSyncPrices)).toBe(true);
    expect(isPublicPath(apiRoutes.cronUpdateRates)).toBe(true);
  });

  it('requires a session for collection pages and protected APIs', () => {
    expect(pathRequiresSession(routes.home)).toBe(true);
    expect(pathRequiresSession(routes.collection)).toBe(true);
    expect(pathRequiresSession(apiRoutes.collection)).toBe(true);
    expect(pathRequiresSession(apiRoutes.collectionAdd)).toBe(true);
    expect(pathRequiresSession(apiRoutes.collectionSets)).toBe(true);
    expect(pathRequiresSession(apiRoutes.collectionItem(1))).toBe(true);
    expect(pathRequiresSession(apiRoutes.cardSearch)).toBe(true);
    expect(pathRequiresSession(apiRoutes.userPreferences)).toBe(true);
  });

  it('does not require a session for public paths', () => {
    expect(pathRequiresSession(routes.login)).toBe(false);
    expect(pathRequiresSession('/health')).toBe(false);
    expect(pathRequiresSession(apiRoutes.cronSyncPrices)).toBe(false);
  });

  it('documents middleware matcher paths aligned with protected routes', () => {
    expect(authMiddlewareMatcherForTests).toContain('/');
    expect(authMiddlewareMatcherForTests).toContain(routes.collection);
    expect(authMiddlewareMatcherForTests.some((entry) => entry.includes('/api/collection'))).toBe(
      true,
    );
    expect(authMiddlewareMatcherForTests.some((entry) => entry.includes('/api/cards'))).toBe(true);
    expect(authMiddlewareMatcherForTests.some((entry) => entry.includes('/api/user'))).toBe(true);
  });
});
