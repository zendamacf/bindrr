import bcrypt from 'bcryptjs';
import { inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  card_sets,
  cards,
  collection_logs,
  collection_printings,
  printings,
  users,
} from '@/lib/db/schema';

/** bcrypt cost-4 hashes for common test passwords (avoids hashing on every insert). */
const TEST_PASSWORD_HASHES: Record<string, string> = {
  secret: '$2b$04$fJdNKZctOjBErFJEtKRJ.uCFaIgdbXx4o3AnJSTbzYiDwbbh3RgMK',
  correct: '$2b$04$Vo7NjZF9Gaus/.ohy2Q7N.uE4IcUfhcwRcccgjCItQ4uig0lvoiJG',
};

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

/** Tables with `serial` primary keys used by integration test fixtures. */
const FIXTURE_SERIAL_TABLES = [
  'users',
  'card_sets',
  'cards',
  'printings',
  'collection_printings',
  'collection_logs',
  'printing_price_history',
  'currencies',
] as const;

/**
 * Aligns serial sequences with MAX(id) so the next insert never reuses an existing
 * primary key. Needed because DELETE does not rewind sequences and orphaned rows
 * (e.g. from a failed cleanup) can otherwise cause flaky duplicate-key errors in CI.
 */
export async function realignTestSerialSequences() {
  for (const table of FIXTURE_SERIAL_TABLES) {
    await db.execute(
      sql.raw(`
      SELECT setval(
        pg_get_serial_sequence('public.${table}', 'id'),
        COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1,
        false
      )
    `),
    );
  }
}

function testEmail(label: string) {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.bindrr`;
}

function resolvePasswordHash(password: string, override?: string): Promise<string> | string {
  if (override) return override;
  const known = TEST_PASSWORD_HASHES[password];
  if (known) return known;
  return bcrypt.hash(password, 4);
}

export async function insertTestUser(
  ids: DbFixtureIds,
  options?: { email?: string; password?: string; passwordHash?: string },
) {
  const email = (options?.email ?? testEmail('user')).toLowerCase();
  const password = options?.password ?? 'secret';
  const passwordHash = await resolvePasswordHash(password, options?.passwordHash);
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash })
    .returning({ id: users.id, email: users.email, passwordHash: users.passwordHash });

  ids.userIds.push(user.id);
  return { ...user, password };
}

export async function insertTestCardSet(
  ids: DbFixtureIds,
  data: {
    name: string;
    code: string;
    released: string;
    symbolSvgUri?: string | null;
  },
) {
  const [set] = await db
    .insert(card_sets)
    .values({
      name: data.name,
      code: data.code,
      released: data.released,
      symbol_svg_uri: data.symbolSvgUri,
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

type PrintingInsert = {
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
};

function printingValues(data: PrintingInsert) {
  return {
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
  };
}

export async function insertTestPrinting(ids: DbFixtureIds, data: PrintingInsert) {
  const [printing] = await db.insert(printings).values(printingValues(data)).returning();

  ids.printingIds.push(printing.id);
  return printing;
}

export async function insertTestPrintings(ids: DbFixtureIds, rows: PrintingInsert[]) {
  if (rows.length === 0) return [];

  const inserted = await db
    .insert(printings)
    .values(rows.map((row) => printingValues(row)))
    .returning();

  for (const printing of inserted) {
    ids.printingIds.push(printing.id);
  }
  return inserted;
}

type CollectionPrintingInsert = {
  userId: number;
  printingId: number;
  quantity: number;
  foil?: boolean;
  etched?: boolean;
};

export async function insertTestCollectionPrinting(
  ids: DbFixtureIds,
  data: CollectionPrintingInsert,
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

export async function insertTestCollectionPrintings(
  ids: DbFixtureIds,
  rows: CollectionPrintingInsert[],
) {
  if (rows.length === 0) return [];

  const inserted = await db
    .insert(collection_printings)
    .values(
      rows.map((row) => ({
        user_id: row.userId,
        printing_id: row.printingId,
        quantity: row.quantity,
        foil: row.foil ?? false,
        etched: row.etched ?? false,
      })),
    )
    .returning();

  for (const row of inserted) {
    ids.collectionPrintingIds.push(row.id);
  }
  return inserted;
}

export async function cleanupFixture(ids: DbFixtureIds) {
  const hasData =
    ids.userIds.length > 0 ||
    ids.printingIds.length > 0 ||
    ids.collectionPrintingIds.length > 0 ||
    ids.cardIds.length > 0 ||
    ids.cardSetIds.length > 0;

  if (hasData) {
    await db.transaction(async (tx) => {
      if (ids.userIds.length > 0) {
        await tx.delete(collection_logs).where(inArray(collection_logs.user_id, ids.userIds));
        await tx
          .delete(collection_printings)
          .where(inArray(collection_printings.user_id, ids.userIds));
      }
      if (ids.printingIds.length > 0) {
        await tx
          .delete(collection_logs)
          .where(inArray(collection_logs.printing_id, ids.printingIds));
        await tx
          .delete(collection_printings)
          .where(inArray(collection_printings.printing_id, ids.printingIds));
      }
      if (ids.collectionPrintingIds.length > 0) {
        await tx
          .delete(collection_printings)
          .where(inArray(collection_printings.id, ids.collectionPrintingIds));
      }
      if (ids.printingIds.length > 0) {
        await tx.delete(printings).where(inArray(printings.id, ids.printingIds));
      }
      if (ids.cardIds.length > 0) {
        await tx.delete(cards).where(inArray(cards.id, ids.cardIds));
      }
      if (ids.cardSetIds.length > 0) {
        await tx.delete(card_sets).where(inArray(card_sets.id, ids.cardSetIds));
      }
      if (ids.userIds.length > 0) {
        await tx.delete(users).where(inArray(users.id, ids.userIds));
      }
    });

    ids.userIds.length = 0;
    ids.cardSetIds.length = 0;
    ids.cardIds.length = 0;
    ids.printingIds.length = 0;
    ids.collectionPrintingIds.length = 0;
  }

  await realignTestSerialSequences();
}
