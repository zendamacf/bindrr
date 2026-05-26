import bcrypt from 'bcryptjs';
import { inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { card_sets, cards, collection_printings, printings, users } from '@/lib/db/schema';

export type DbFixtureIds = {
  userIds: number[];
  cardSetIds: number[];
  cardIds: number[];
  printingIds: number[];
  collectionPrintingIds: number[];
};

export function createFixtureTracker(): DbFixtureIds {
  return {
    userIds: [],
    cardSetIds: [],
    cardIds: [],
    printingIds: [],
    collectionPrintingIds: [],
  };
}

function testEmail(label: string) {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.bindrr`;
}

export async function insertTestUser(
  ids: DbFixtureIds,
  options?: { email?: string; password?: string },
) {
  const email = (options?.email ?? testEmail('user')).toLowerCase();
  const password = options?.password ?? 'secret';
  const passwordHash = await bcrypt.hash(password, 4);
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash })
    .returning({ id: users.id, email: users.email, passwordHash: users.passwordHash });

  ids.userIds.push(user.id);
  return { ...user, password };
}

export async function insertTestCardSet(
  ids: DbFixtureIds,
  data: { name: string; code: string; released: string },
) {
  const [set] = await db
    .insert(card_sets)
    .values({
      name: data.name,
      code: data.code,
      released: data.released,
    })
    .returning();

  ids.cardSetIds.push(set.id);
  return set;
}

export async function insertTestCard(ids: DbFixtureIds, name: string) {
  const [card] = await db.insert(cards).values({ name }).returning();
  ids.cardIds.push(card.id);
  return card;
}

export async function insertTestPrinting(
  ids: DbFixtureIds,
  data: {
    cardId: number;
    cardSetId: number;
    collectornumber: string;
    rarity?: string;
    language?: string;
    price?: string;
    foilprice?: string;
    etchedprice?: string;
    multiverseId?: number;
    scryfallId?: string;
  },
) {
  const [printing] = await db
    .insert(printings)
    .values({
      card_id: data.cardId,
      card_set_id: data.cardSetId,
      collectornumber: data.collectornumber,
      rarity: data.rarity,
      language: data.language,
      price: data.price,
      foilprice: data.foilprice,
      etchedprice: data.etchedprice,
      multiverse_id: data.multiverseId,
      scryfall_id: data.scryfallId,
    })
    .returning();

  ids.printingIds.push(printing.id);
  return printing;
}

export async function insertTestCollectionPrinting(
  ids: DbFixtureIds,
  data: {
    userId: number;
    printingId: number;
    quantity: number;
    foil?: boolean;
    etched?: boolean;
  },
) {
  const [row] = await db
    .insert(collection_printings)
    .values({
      user_id: data.userId,
      printing_id: data.printingId,
      quantity: data.quantity,
      foil: data.foil ?? false,
      etched: data.etched ?? false,
    })
    .returning();

  ids.collectionPrintingIds.push(row.id);
  return row;
}

export async function cleanupFixture(ids: DbFixtureIds) {
  if (ids.userIds.length > 0) {
    await db.delete(collection_printings).where(inArray(collection_printings.user_id, ids.userIds));
  }
  if (ids.printingIds.length > 0) {
    await db.delete(printings).where(inArray(printings.id, ids.printingIds));
  }
  if (ids.cardIds.length > 0) {
    await db.delete(cards).where(inArray(cards.id, ids.cardIds));
  }
  if (ids.cardSetIds.length > 0) {
    await db.delete(card_sets).where(inArray(card_sets.id, ids.cardSetIds));
  }
  if (ids.userIds.length > 0) {
    await db.delete(users).where(inArray(users.id, ids.userIds));
  }

  ids.userIds.length = 0;
  ids.cardSetIds.length = 0;
  ids.cardIds.length = 0;
  ids.printingIds.length = 0;
  ids.collectionPrintingIds.length = 0;
}
