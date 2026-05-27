import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  cleanupFixture,
  createFixtureTracker,
  type DbFixtureIds,
  insertTestCardSet,
} from '@/test/db-fixture';
import { getCardSets } from './getCardSets';

describe('getCardSets', () => {
  let ids: DbFixtureIds;

  beforeEach(() => {
    ids = createFixtureTracker();
  });

  afterEach(async () => {
    await cleanupFixture(ids);
  });

  it('returns sets ordered by release date descending', async () => {
    const alphaCode = `LEA-${Date.now()}`;
    const betaCode = `LEB-${Date.now()}`;
    await insertTestCardSet(ids, {
      name: 'Alpha',
      code: alphaCode,
      released: '1993-08-05',
      symbolSvgUri: 'https://example.com/alpha.svg',
    });
    await insertTestCardSet(ids, {
      name: 'Beta',
      code: betaCode,
      released: '1993-10-04',
      symbolSvgUri: 'https://example.com/beta.svg',
    });

    const sets = await getCardSets();
    const betaIndex = sets.findIndex((s) => s.code === betaCode);
    const alphaIndex = sets.findIndex((s) => s.code === alphaCode);

    expect(betaIndex).toBeGreaterThanOrEqual(0);
    expect(alphaIndex).toBeGreaterThanOrEqual(0);
    expect(betaIndex).toBeLessThan(alphaIndex);
  });
});
