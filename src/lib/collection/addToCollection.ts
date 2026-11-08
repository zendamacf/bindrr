import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { collection_logs, collection_printings } from '@/lib/db/schema';
import { ensurePrinting } from './ensurePrinting';
import { type CardFinish, finishFlags } from './finish';

export async function addToCollection(params: {
  userId: number;
  scryfallId: string;
  quantity: number;
  finish: CardFinish;
}) {
  const quantity = Math.max(1, Math.floor(params.quantity));
  const { foil, etched } = finishFlags(params.finish);

  return db.transaction(async (tx) => {
    const printingId = await ensurePrinting(tx, params.scryfallId);

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
