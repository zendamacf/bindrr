import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { collection_logs } from '@/lib/db/schema';
import {
  cleanupFixture,
  createFixtureTracker,
  type DbFixtureIds,
  insertTestCard,
  insertTestCardSet,
  insertTestPrinting,
  insertTestUser,
} from '@/test/db-fixture';
import { getCollectionActivity } from './getCollectionActivity';

describe('getCollectionActivity', () => {
  let ids: DbFixtureIds;

  beforeEach(() => {
    ids = createFixtureTracker();
  });

  afterEach(async () => {
    await cleanupFixture(ids);
  });

  it('returns paginated activity for the signed-in user only', async () => {
    const user = await insertTestUser(ids);
    const other = await insertTestUser(ids);
    const set = await insertTestCardSet(ids, {
      name: 'Alpha',
      code: `LEA-${Date.now()}`,
      released: '1993-08-05',
    });
    const card = await insertTestCard(ids, 'Lightning Bolt');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '161',
      scryfallId: `test-${Date.now()}-activity`,
    });

    await db.insert(collection_logs).values([
      {
        user_id: user.id,
        printing_id: printing.id,
        foil: false,
        etched: false,
        change: 2,
        occurred: new Date('2024-01-02T10:00:00.000Z'),
      },
      {
        user_id: user.id,
        printing_id: printing.id,
        foil: false,
        etched: false,
        change: -1,
        occurred: new Date('2024-01-03T10:00:00.000Z'),
      },
      {
        user_id: other.id,
        printing_id: printing.id,
        foil: false,
        etched: false,
        change: 5,
        occurred: new Date('2024-01-04T10:00:00.000Z'),
      },
    ]);

    const result = await getCollectionActivity({ userId: user.id });

    expect(result.total).toBe(2);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]).toMatchObject({
      cardName: 'Lightning Bolt',
      setName: 'Alpha',
      change: -1,
    });
    expect(result.entries[1]?.change).toBe(2);
  });

  it('filters by card name and set', async () => {
    const user = await insertTestUser(ids);
    const alpha = await insertTestCardSet(ids, {
      name: 'Alpha',
      code: `LEA-A-${Date.now()}`,
      released: '1993-08-05',
    });
    const beta = await insertTestCardSet(ids, {
      name: 'Beta',
      code: `LEB-B-${Date.now()}`,
      released: '1993-10-04',
    });
    const bolt = await insertTestCard(ids, 'Lightning Bolt');
    const growth = await insertTestCard(ids, 'Giant Growth');
    const boltPrinting = await insertTestPrinting(ids, {
      cardId: bolt.id,
      cardSetId: alpha.id,
      collectornumber: '161',
      scryfallId: `test-${Date.now()}-bolt`,
    });
    const growthPrinting = await insertTestPrinting(ids, {
      cardId: growth.id,
      cardSetId: beta.id,
      collectornumber: '1',
      scryfallId: `test-${Date.now()}-growth`,
    });

    await db.insert(collection_logs).values([
      {
        user_id: user.id,
        printing_id: boltPrinting.id,
        change: 1,
      },
      {
        user_id: user.id,
        printing_id: growthPrinting.id,
        change: 1,
      },
    ]);

    const byName = await getCollectionActivity({
      userId: user.id,
      filterSearch: 'bolt',
    });
    expect(byName.total).toBe(1);
    expect(byName.entries[0]?.cardName).toBe('Lightning Bolt');

    const bySet = await getCollectionActivity({
      userId: user.id,
      filterSet: beta.id,
    });
    expect(bySet.total).toBe(1);
    expect(bySet.entries[0]?.setName).toBe('Beta');
  });
});
