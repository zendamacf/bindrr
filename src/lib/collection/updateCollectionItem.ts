import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { collection_logs, collection_printings } from '@/lib/db/schema';

export type UpdateCollectionItemResult = {
  ok: true;
  removed: boolean;
  collectionPrintingId?: number;
};

export async function updateCollectionItemQuantity(params: {
  userId: number;
  collectionPrintingId: number;
  quantity: number;
}): Promise<UpdateCollectionItemResult | null> {
  if (!Number.isFinite(params.quantity) || params.quantity < 0) {
    throw new Error('Invalid quantity');
  }

  const quantity = Math.floor(params.quantity);

  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        id: collection_printings.id,
        printingId: collection_printings.printing_id,
        currentQuantity: collection_printings.quantity,
        foil: collection_printings.foil,
        etched: collection_printings.etched,
      })
      .from(collection_printings)
      .where(
        and(
          eq(collection_printings.id, params.collectionPrintingId),
          eq(collection_printings.user_id, params.userId),
        ),
      )
      .limit(1);

    if (!row) return null;

    const delta = quantity - row.currentQuantity;
    if (delta === 0) {
      return { ok: true, removed: false, collectionPrintingId: row.id };
    }

    if (quantity === 0) {
      await tx.delete(collection_printings).where(eq(collection_printings.id, row.id));
      await tx.insert(collection_logs).values({
        user_id: params.userId,
        printing_id: row.printingId,
        foil: row.foil,
        etched: row.etched,
        change: -row.currentQuantity,
      });
      return { ok: true, removed: true };
    }

    await tx
      .update(collection_printings)
      .set({ quantity })
      .where(eq(collection_printings.id, row.id));

    await tx.insert(collection_logs).values({
      user_id: params.userId,
      printing_id: row.printingId,
      foil: row.foil,
      etched: row.etched,
      change: delta,
    });

    return { ok: true, removed: false, collectionPrintingId: row.id };
  });
}
