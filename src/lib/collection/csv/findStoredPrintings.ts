import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { card_sets, cards, printings } from '@/lib/db/schema';
import type { DbPrintingMatch, LookupKey } from './resolveImportRows';

const CHUNK_SIZE = 500;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

const columns = {
  printingId: printings.id,
  scryfallId: printings.scryfall_id,
  name: cards.name,
  setCode: card_sets.code,
  collectorNumber: printings.collectornumber,
  language: printings.language,
  price: printings.price,
  foilprice: printings.foilprice,
  etchedprice: printings.etchedprice,
};

/** Finds printings that are in the database for the given keys. */
export async function findStoredPrintings(
  keys: LookupKey[],
): Promise<Map<string, DbPrintingMatch>> {
  const result = new Map<string, DbPrintingMatch>();

  const idKeys = keys.filter(
    (entry): entry is Extract<LookupKey, { scryfallId: string }> => 'scryfallId' in entry,
  );
  const setKeys = keys.filter(
    (entry): entry is Extract<LookupKey, { set: string }> => 'set' in entry,
  );

  for (const part of chunk(idKeys, CHUNK_SIZE)) {
    const found = await db
      .select(columns)
      .from(printings)
      .innerJoin(cards, eq(cards.id, printings.card_id))
      .innerJoin(card_sets, eq(card_sets.id, printings.card_set_id))
      .where(
        inArray(
          printings.scryfall_id,
          part.map((entry) => entry.scryfallId),
        ),
      );
    for (const row of found) {
      if (row.scryfallId)
        result.set(`id:${row.scryfallId}`, { ...row, scryfallId: row.scryfallId });
    }
  }

  for (const part of chunk(setKeys, CHUNK_SIZE)) {
    const found = await db
      .select(columns)
      .from(printings)
      .innerJoin(cards, eq(cards.id, printings.card_id))
      .innerJoin(card_sets, eq(card_sets.id, printings.card_set_id))
      .where(
        and(
          inArray(
            sql`lower(${card_sets.code})`,
            part.map((entry) => entry.set),
          ),
          inArray(
            sql`lower(${printings.collectornumber})`,
            part.map((entry) => entry.collectorNumber.toLowerCase()),
          ),
          inArray(printings.language, [...new Set(part.map((entry) => entry.language))]),
        ),
      );
    for (const row of found) {
      if (!row.scryfallId) continue;
      const key = `sn:${row.setCode.toLowerCase()}:${row.collectorNumber.toLowerCase()}:${row.language}`;
      result.set(key, { ...row, scryfallId: row.scryfallId });
    }
  }

  return result;
}
