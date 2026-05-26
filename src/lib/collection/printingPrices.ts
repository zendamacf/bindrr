import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { printing_price_history, printings } from '@/lib/db/schema';
import { type ScryfallCard, scryfallPricesFromCard } from '@/lib/scryfall/client';

export type PrintingPrices = {
  price: string | null;
  foilprice: string | null;
  etchedprice: string | null;
};

export type PriceDbExecutor = Pick<typeof db, 'update' | 'insert'>;

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

export async function applyScryfallPricesToPrintings(
  cards: ScryfallCard[],
  updatedAt: Date = new Date(),
  executor: PriceDbExecutor = db,
): Promise<number> {
  let updated = 0;

  for (const card of cards) {
    const prices = scryfallPricesFromCard(card);
    const applied = await applyPrintingPricesByScryfallId(card.id, prices, updatedAt, executor);
    if (applied) updated += 1;
  }

  return updated;
}
