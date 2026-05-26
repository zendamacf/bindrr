import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  card_sets,
  cards,
  collection_logs,
  collection_printings,
  printings,
} from '@/lib/db/schema';
import {
  formatLanguage,
  printingImageUrl,
  rarityLabel,
  resolveSetSymbolUrl,
  unitPrice,
} from './helpers';
import { printingFinishAvailability } from './printingFinishAvailability';
import type { CollectionItemDetail } from './types';

export async function getCollectionItem(
  userId: number,
  collectionPrintingId: number,
): Promise<CollectionItemDetail | null> {
  const [row] = await db
    .select({
      collectionPrintingId: collection_printings.id,
      printingId: printings.id,
      name: cards.name,
      setName: card_sets.name,
      setCode: card_sets.code,
      symbolSvgUri: card_sets.symbol_svg_uri,
      collectorNumber: printings.collectornumber,
      rarityCode: printings.rarity,
      quantity: collection_printings.quantity,
      foil: collection_printings.foil,
      etched: collection_printings.etched,
      price: printings.price,
      foilprice: printings.foilprice,
      etchedprice: printings.etchedprice,
      language: printings.language,
      scryfallId: printings.scryfall_id,
      tcgplayerProductId: printings.tcgplayer_productid,
    })
    .from(collection_printings)
    .innerJoin(printings, eq(collection_printings.printing_id, printings.id))
    .innerJoin(cards, eq(printings.card_id, cards.id))
    .innerJoin(card_sets, eq(printings.card_set_id, card_sets.id))
    .where(
      and(
        eq(collection_printings.id, collectionPrintingId),
        eq(collection_printings.user_id, userId),
      ),
    )
    .limit(1);

  if (!row) return null;

  const history = await db
    .select({
      id: collection_logs.id,
      change: collection_logs.change,
      occurred: collection_logs.occurred,
    })
    .from(collection_logs)
    .where(
      and(
        eq(collection_logs.user_id, userId),
        eq(collection_logs.printing_id, row.printingId),
        eq(collection_logs.foil, row.foil),
        eq(collection_logs.etched, row.etched),
      ),
    )
    .orderBy(desc(collection_logs.occurred));

  const price = unitPrice(row.foil, row.etched, row.price, row.foilprice, row.etchedprice);
  const finishAvailability = printingFinishAvailability(row.price, row.foilprice, row.etchedprice);

  return {
    collectionPrintingId: row.collectionPrintingId,
    printingId: row.printingId,
    name: row.name,
    setName: row.setName,
    setCode: row.setCode,
    collectorNumber: row.collectorNumber,
    rarity: rarityLabel(row.rarityCode),
    quantity: row.quantity,
    foil: row.foil,
    etched: row.etched,
    price,
    basePrice: null,
    currencyCode: 'USD',
    language: formatLanguage(row.language),
    imageUrl: printingImageUrl(row.scryfallId),
    setSymbolUrl: resolveSetSymbolUrl(row.symbolSvgUri, row.setCode),
    scryfallId: row.scryfallId,
    tcgplayerProductId: row.tcgplayerProductId,
    ...finishAvailability,
    history: history.map((entry) => ({
      id: entry.id,
      change: entry.change,
      occurred: entry.occurred.toISOString(),
    })),
  };
}
