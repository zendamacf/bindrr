import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { printing_price_history, printings } from '@/lib/db/schema';
import { type ScryfallCard, scryfallPricesFromCard } from '@/lib/scryfall/client';

export type PrintingPrices = {
  price: string | null;
  foilprice: string | null;
  etchedprice: string | null;
};

export type PriceDbExecutor = Pick<typeof db, 'update' | 'insert'>;

type PriceSyncTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** UTC calendar date as YYYY-MM-DD for `printing_price_history.recorded_on`. */
export function toUtcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function upsertPrintingPriceHistory(
  printingId: number,
  prices: PrintingPrices,
  recordedOn: string,
  executor: PriceDbExecutor = db,
) {
  await executor
    .insert(printing_price_history)
    .values({
      printingId,
      recordedOn,
      price: prices.price,
      foilprice: prices.foilprice,
      etchedprice: prices.etchedprice,
    })
    .onConflictDoUpdate({
      target: [printing_price_history.printingId, printing_price_history.recordedOn],
      set: {
        price: prices.price,
        foilprice: prices.foilprice,
        etchedprice: prices.etchedprice,
      },
    });
}

export async function applyPrintingPricesByScryfallId(
  scryfallId: string,
  prices: PrintingPrices,
  updatedAt: Date = new Date(),
  executor: PriceDbExecutor = db,
): Promise<boolean> {
  const [row] = await executor
    .update(printings)
    .set({
      price: prices.price,
      foilprice: prices.foilprice,
      etchedprice: prices.etchedprice,
      pricesUpdatedAt: updatedAt,
    })
    .where(eq(printings.scryfall_id, scryfallId))
    .returning({ id: printings.id });

  if (!row) return false;

  await upsertPrintingPriceHistory(row.id, prices, toUtcDateString(updatedAt), executor);
  return true;
}

export async function recordPrintingPricesForPrintingId(
  printingId: number,
  prices: PrintingPrices,
  updatedAt: Date = new Date(),
  executor: PriceDbExecutor = db,
) {
  const recordedOn = toUtcDateString(updatedAt);
  await executor
    .update(printings)
    .set({
      price: prices.price,
      foilprice: prices.foilprice,
      etchedprice: prices.etchedprice,
      pricesUpdatedAt: updatedAt,
    })
    .where(eq(printings.id, printingId));
  await upsertPrintingPriceHistory(printingId, prices, recordedOn, executor);
}

async function bulkUpdatePrintingsByScryfallId(
  rows: { scryfallId: string; prices: PrintingPrices }[],
  updatedAt: Date,
  tx: PriceSyncTx,
) {
  const updatedAtIso = updatedAt.toISOString();
  const valueRows = rows.map(
    (row) =>
      sql`(${row.scryfallId}, ${row.prices.price}, ${row.prices.foilprice}, ${row.prices.etchedprice})`,
  );

  await tx.execute(sql`
    UPDATE printings AS p SET
      price = v.price::numeric,
      foilprice = v.foilprice::numeric,
      etchedprice = v.etchedprice::numeric,
      prices_updated_at = ${updatedAtIso}::timestamptz
    FROM (VALUES ${sql.join(valueRows, sql`, `)}) AS v(scryfall_id, price, foilprice, etchedprice)
    WHERE p.scryfall_id = v.scryfall_id
  `);
}

async function bulkUpsertPrintingPriceHistory(
  rows: { printingId: number; prices: PrintingPrices }[],
  recordedOn: string,
  tx: PriceSyncTx,
) {
  await tx
    .insert(printing_price_history)
    .values(
      rows.map((row) => ({
        printingId: row.printingId,
        recordedOn,
        price: row.prices.price,
        foilprice: row.prices.foilprice,
        etchedprice: row.prices.etchedprice,
      })),
    )
    .onConflictDoUpdate({
      target: [printing_price_history.printingId, printing_price_history.recordedOn],
      set: {
        price: sql`excluded.price`,
        foilprice: sql`excluded.foilprice`,
        etchedprice: sql`excluded.etchedprice`,
      },
    });
}

/**
 * Applies Scryfall prices to matching printings in bulk (lookup + update + history).
 * Used by the collection price sync cron.
 */
export async function applyScryfallPricesToPrintings(
  cards: ScryfallCard[],
  updatedAt: Date = new Date(),
): Promise<number> {
  if (cards.length === 0) return 0;

  const scryfallIds = cards.map((card) => card.id);
  const recordedOn = toUtcDateString(updatedAt);

  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: printings.id, scryfall_id: printings.scryfall_id })
      .from(printings)
      .where(inArray(printings.scryfall_id, scryfallIds));

    const printingIdByScryfallId = new Map(
      existing
        .map((row) => (row.scryfall_id != null ? ([row.scryfall_id, row.id] as const) : null))
        .filter((entry): entry is readonly [string, number] => entry != null),
    );

    const updates: { printingId: number; scryfallId: string; prices: PrintingPrices }[] = [];
    for (const card of cards) {
      const printingId = printingIdByScryfallId.get(card.id);
      if (printingId == null) continue;
      updates.push({
        printingId,
        scryfallId: card.id,
        prices: scryfallPricesFromCard(card),
      });
    }

    if (updates.length === 0) return 0;

    await bulkUpdatePrintingsByScryfallId(
      updates.map((row) => ({ scryfallId: row.scryfallId, prices: row.prices })),
      updatedAt,
      tx,
    );
    await bulkUpsertPrintingPriceHistory(
      updates.map((row) => ({ printingId: row.printingId, prices: row.prices })),
      recordedOn,
      tx,
    );

    return updates.length;
  });
}
