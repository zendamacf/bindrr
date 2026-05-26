import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  card_sets,
  cards,
  collection_logs,
  collection_printings,
  printings,
} from '@/lib/db/schema';
import { scryfallGetCardById, scryfallPrimaryFace } from '@/lib/scryfall/client';
import { type CardFinish, finishFlags } from './finish';

function toRarityCode(rarity: string | undefined): string | null {
  if (!rarity) return null;
  return rarity.trim().toUpperCase().slice(0, 1) || null;
}

function toColors(colors: string[] | undefined): string | null {
  if (!colors || colors.length === 0) return null;
  return colors.join('');
}

export async function addToCollection(params: {
  userId: number;
  scryfallId: string;
  quantity: number;
  finish: CardFinish;
}) {
  const quantity = Math.max(1, Math.floor(params.quantity));
  const { foil, etched } = finishFlags(params.finish);

  return db.transaction(async (tx) => {
    const existingPrinting = await tx
      .select({ id: printings.id })
      .from(printings)
      .where(eq(printings.scryfall_id, params.scryfallId))
      .limit(1);

    let printingId: number;

    if (existingPrinting.length > 0) {
      printingId = existingPrinting[0].id;
    } else {
      const full = await scryfallGetCardById(params.scryfallId);
      const face = scryfallPrimaryFace(full);

      const setCode = full.set.toUpperCase();
      const setName = full.set_name;
      const released = full.released_at ?? '1970-01-01';

      const [setRow] = await tx
        .select({ id: card_sets.id })
        .from(card_sets)
        .where(eq(card_sets.code, setCode))
        .limit(1);

      const setId =
        setRow?.id ??
        (
          await tx
            .insert(card_sets)
            .values({ code: setCode, name: setName, released })
            .returning({ id: card_sets.id })
        )[0].id;

      const cardName = full.name;
      const typeline = 'type_line' in face ? (face.type_line ?? null) : (full.type_line ?? null);
      const manacost = 'mana_cost' in face ? (face.mana_cost ?? null) : (full.mana_cost ?? null);
      const cmc = 'cmc' in face ? (face.cmc ?? null) : (full.cmc ?? null);
      const colors = toColors('colors' in face ? face.colors : full.colors);
      const multifaced = Boolean(full.card_faces && full.card_faces.length > 0);

      const existingCard = await tx
        .select({ id: cards.id })
        .from(cards)
        .where(
          and(eq(cards.name, cardName), sql`${cards.typeline} IS NOT DISTINCT FROM ${typeline}`),
        )
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
      const language = full.lang ?? null;
      const rarity = toRarityCode(full.rarity);
      const price = full.prices?.usd ?? null;
      const foilprice = full.prices?.usd_foil ?? null;
      const etchedprice = full.prices?.usd_etched ?? null;
      const tcgplayerProductId = full.tcgplayer_id != null ? String(full.tcgplayer_id) : null;

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
        })
        .onConflictDoUpdate({
          target: printings.scryfall_id,
          set: {
            price,
            foilprice,
            etchedprice,
            tcgplayer_productid: tcgplayerProductId,
          },
        })
        .returning({ id: printings.id });

      printingId = insertedPrinting.id;
    }

    const updated = await tx
      .update(collection_printings)
      .set({ quantity: sql`${collection_printings.quantity} + ${quantity}` })
      .where(
        and(
          eq(collection_printings.user_id, params.userId),
          eq(collection_printings.printing_id, printingId),
          eq(collection_printings.foil, foil),
          eq(collection_printings.etched, etched),
        ),
      )
      .returning({ id: collection_printings.id });

    const row =
      updated[0] ??
      (
        await tx
          .insert(collection_printings)
          .values({
            user_id: params.userId,
            printing_id: printingId,
            foil,
            etched,
            quantity,
          })
          .returning({ id: collection_printings.id })
      )[0];

    await tx.insert(collection_logs).values({
      user_id: params.userId,
      printing_id: printingId,
      foil,
      etched,
      change: quantity,
    });

    return { ok: true, collectionPrintingId: row.id, printingId };
  });
}
