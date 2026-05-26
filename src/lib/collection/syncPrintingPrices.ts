import { eq, isNotNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { collection_printings, printings } from '@/lib/db/schema';
import {
  type ScryfallCard,
  scryfallFetchCollection,
  scryfallPricesFromCard,
} from '@/lib/scryfall/client';

export async function listCollectionScryfallIds(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ scryfallId: printings.scryfall_id })
    .from(printings)
    .innerJoin(collection_printings, eq(collection_printings.printing_id, printings.id))
    .where(isNotNull(printings.scryfall_id));

  return rows.map((row) => row.scryfallId).filter((id): id is string => id != null);
}

export async function applyScryfallPricesToPrintings(
  cards: ScryfallCard[],
  updatedAt: Date = new Date(),
): Promise<number> {
  let updated = 0;

  for (const card of cards) {
    const prices = scryfallPricesFromCard(card);
    await db
      .update(printings)
      .set({
        price: prices.price,
        foilprice: prices.foilprice,
        etchedprice: prices.etchedprice,
        pricesUpdatedAt: updatedAt,
      })
      .where(eq(printings.scryfall_id, card.id));
    updated += 1;
  }

  return updated;
}

/** Refreshes USD prices for printings that appear in at least one user collection. */
export async function syncCollectionPrintingPrices(): Promise<{
  updated: number;
  total: number;
}> {
  const scryfallIds = await listCollectionScryfallIds();
  if (scryfallIds.length === 0) {
    return { updated: 0, total: 0 };
  }

  const cards = await scryfallFetchCollection(scryfallIds);
  const updated = await applyScryfallPricesToPrintings(cards);

  return { updated, total: scryfallIds.length };
}
