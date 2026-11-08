import { and, eq, sql } from 'drizzle-orm';
import type { db } from '@/lib/db';
import { cards, printings } from '@/lib/db/schema';
import { type ScryfallCard, scryfallGetCardById, scryfallPrimaryFace } from '@/lib/scryfall/client';
import { DEFAULT_SCRYFALL_LANGUAGE } from '../scryfall/languages';
import { ensureCardSet } from './ensureCardSet';
import { recordPrintingPricesForPrintingId } from './printingPrices';
import { isPrintingPriceStale, refreshPrintingPricesByScryfallId } from './refreshPrintingPrices';

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

function toRarityCode(rarity: string | undefined): string | null {
  if (!rarity) return null;
  return rarity.trim().toUpperCase().slice(0, 1) || null;
}

function toColors(colors: string[] | undefined): string | null {
  if (!colors || colors.length === 0) return null;
  return colors.join('');
}

/**
 * Finds the printing for a Scryfall ID and returns its ID.
 * If the printing does not exist, this function gets it from Scryfall and adds it.
 * If the stored prices are old, this function updates them.
 * If the caller has the Scryfall card already, pass it to skip a second Scryfall request.
 */
export async function ensurePrinting(
  tx: DbTransaction,
  scryfallId: string,
  prefetchedCard?: ScryfallCard,
): Promise<number> {
  const existingPrinting = await tx
    .select({
      id: printings.id,
      pricesUpdatedAt: printings.pricesUpdatedAt,
    })
    .from(printings)
    .where(eq(printings.scryfall_id, scryfallId))
    .limit(1);

  if (existingPrinting.length > 0) {
    if (isPrintingPriceStale(existingPrinting[0].pricesUpdatedAt)) {
      await refreshPrintingPricesByScryfallId(scryfallId, tx);
    }
    return existingPrinting[0].id;
  }

  const full = prefetchedCard ?? (await scryfallGetCardById(scryfallId));
  const face = scryfallPrimaryFace(full);

  const setCode = full.set.toUpperCase();
  const setName = full.set_name;
  const released = full.released_at ?? '1970-01-01';

  const setId = await ensureCardSet(tx, {
    code: setCode,
    name: setName,
    released,
  });

  const cardName = full.name;
  const typeline = 'type_line' in face ? (face.type_line ?? null) : (full.type_line ?? null);
  const manacost = 'mana_cost' in face ? (face.mana_cost ?? null) : (full.mana_cost ?? null);
  const cmc = 'cmc' in face ? (face.cmc ?? null) : (full.cmc ?? null);
  const colors = toColors('colors' in face ? face.colors : full.colors);
  const multifaced = Boolean(full.card_faces && full.card_faces.length > 0);

  const existingCard = await tx
    .select({ id: cards.id })
    .from(cards)
    .where(and(eq(cards.name, cardName), sql`${cards.typeline} IS NOT DISTINCT FROM ${typeline}`))
    .limit(1);

  const cardId =
    existingCard[0]?.id ??
    (
      await tx
        .insert(cards)
        .values({
          name: cardName,
          colors,
          multifaced,
          cmc: cmc != null ? String(cmc) : null,
          typeline,
          manacost,
        })
        .returning({ id: cards.id })
    )[0].id;

  const multiverseId = full.multiverse_ids?.[0] ?? null;
  const language = full.lang ?? DEFAULT_SCRYFALL_LANGUAGE;
  const rarity = toRarityCode(full.rarity);
  const price = full.prices?.usd ?? null;
  const foilprice = full.prices?.usd_foil ?? null;
  const etchedprice = full.prices?.usd_etched ?? null;
  const tcgplayerProductId = full.tcgplayer_id != null ? String(full.tcgplayer_id) : null;

  const priceUpdatedAt = new Date();
  const [insertedPrinting] = await tx
    .insert(printings)
    .values({
      card_id: cardId,
      card_set_id: setId,
      collectornumber: full.collector_number,
      multiverse_id: multiverseId,
      price,
      foilprice,
      etchedprice,
      tcgplayer_productid: tcgplayerProductId,
      scryfall_id: full.id,
      rarity,
      language,
      pricesUpdatedAt: priceUpdatedAt,
    })
    .onConflictDoUpdate({
      target: printings.scryfall_id,
      set: {
        price,
        foilprice,
        etchedprice,
        tcgplayer_productid: tcgplayerProductId,
        pricesUpdatedAt: priceUpdatedAt,
      },
    })
    .returning({ id: printings.id });

  await recordPrintingPricesForPrintingId(
    insertedPrinting.id,
    { price, foilprice, etchedprice },
    priceUpdatedAt,
    tx,
  );

  return insertedPrinting.id;
}
