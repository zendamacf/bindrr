/**
 * Seeds deterministic data for Playwright E2E runs. Requires DATABASE_URL.
 *
 * Usage: npm run e2e:seed
 */
import { eq, sql } from 'drizzle-orm';
import { db } from '../src/lib/db';
import { collection_logs, users } from '../src/lib/db/schema';
import {
  createFixtureTracker,
  insertTestCard,
  insertTestCardSet,
  insertTestCollectionPrinting,
  insertTestPrinting,
  insertTestUser,
} from '../src/test/db-fixture';
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from './constants';

async function main() {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${E2E_USER_EMAIL.toLowerCase()}`)
    .limit(1);

  if (existing.length > 0) {
    const userId = existing[0].id;
    await db.delete(collection_logs).where(eq(collection_logs.user_id, userId));
    await db.execute(sql`DELETE FROM collection_printings WHERE user_id = ${userId}`);
    await db.delete(users).where(eq(users.id, userId));
  }

  const ids = createFixtureTracker();
  const user = await insertTestUser(ids, {
    email: E2E_USER_EMAIL,
    password: E2E_USER_PASSWORD,
  });

  const m10 = await insertTestCardSet(ids, {
    name: 'Magic 2010',
    code: 'M10',
    released: '2009-07-17',
  });
  const lea = await insertTestCardSet(ids, {
    name: 'Limited Edition Alpha',
    code: 'LEA',
    released: '1993-08-05',
  });

  const boltCard = await insertTestCard(ids, 'Lightning Bolt');
  const islandCard = await insertTestCard(ids, 'Island');

  const boltPrinting = await insertTestPrinting(ids, {
    cardId: boltCard.id,
    cardSetId: m10.id,
    collectornumber: '146',
    rarity: 'C',
    language: 'en',
    price: '1.50',
    scryfallId: 'e2e-bolt-scryfall-id',
  });
  const islandPrinting = await insertTestPrinting(ids, {
    cardId: islandCard.id,
    cardSetId: lea.id,
    collectornumber: '283',
    rarity: 'C',
    language: 'en',
    price: '0.25',
    scryfallId: 'e2e-island-scryfall-id',
  });

  const boltRow = await insertTestCollectionPrinting(ids, {
    userId: user.id,
    printingId: boltPrinting.id,
    quantity: 2,
  });
  await insertTestCollectionPrinting(ids, {
    userId: user.id,
    printingId: islandPrinting.id,
    quantity: 1,
  });

  await db.insert(collection_logs).values({
    printing_id: boltPrinting.id,
    user_id: user.id,
    change: 2,
    foil: false,
    etched: false,
    occurred: new Date('2024-01-15T12:00:00.000Z'),
  });

  console.log(
    JSON.stringify({
      email: E2E_USER_EMAIL,
      collectionPrintingId: boltRow.id,
      cards: ['Lightning Bolt', 'Island'],
    }),
  );
}

main()
  .then(() => {
    // postgres-js keeps the event loop open unless the pool is closed
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
