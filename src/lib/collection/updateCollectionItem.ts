import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { collection_logs, collection_printings } from '@/lib/db/schema';
import { type CardFinish, finishFlags } from './finish';

export type UpdateCollectionItemResult = {
  ok: true;
  removed: boolean;
  collectionPrintingId?: number;
};

type CollectionRow = {
  id: number;
  printingId: number;
  currentQuantity: number;
  foil: boolean;
  etched: boolean;
};

async function loadCollectionRow(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: number,
  collectionPrintingId: number,
): Promise<CollectionRow | null> {
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
        eq(collection_printings.id, collectionPrintingId),
        eq(collection_printings.user_id, userId),
      ),
    )
    .limit(1);

  return row ?? null;
}

async function writeQuantityLog(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  params: {
    userId: number;
    printingId: number;
    foil: boolean;
    etched: boolean;
    change: number;
  },
) {
  if (params.change === 0) return;
  await tx.insert(collection_logs).values({
    user_id: params.userId,
    printing_id: params.printingId,
    foil: params.foil,
    etched: params.etched,
    change: params.change,
  });
}

async function removeCollectionRow(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  params: {
    userId: number;
    row: CollectionRow;
  },
) {
  await tx.delete(collection_printings).where(eq(collection_printings.id, params.row.id));
  await writeQuantityLog(tx, {
    userId: params.userId,
    printingId: params.row.printingId,
    foil: params.row.foil,
    etched: params.row.etched,
    change: -params.row.currentQuantity,
  });
}

export async function updateCollectionItem(params: {
  userId: number;
  collectionPrintingId: number;
  quantity?: number;
  finish?: CardFinish;
}): Promise<UpdateCollectionItemResult | null> {
  const hasQuantity = params.quantity !== undefined;
  const hasFinish = params.finish !== undefined;

  if (!hasQuantity && !hasFinish) {
    throw new Error('Nothing to update');
  }

  const quantityInput = params.quantity;
  if (hasQuantity) {
    if (quantityInput == null || !Number.isFinite(quantityInput) || quantityInput < 0) {
      throw new Error('Invalid quantity');
    }
  }

  const quantity = hasQuantity ? Math.floor(quantityInput as number) : undefined;
  const finishInput = params.finish;
  const targetFlags = hasFinish && finishInput != null ? finishFlags(finishInput) : null;

  return db.transaction(async (tx) => {
    let row = await loadCollectionRow(tx, params.userId, params.collectionPrintingId);
    if (!row) return null;

    if (targetFlags != null) {
      const finishUnchanged = row.foil === targetFlags.foil && row.etched === targetFlags.etched;

      if (!finishUnchanged) {
        const [existingTarget] = await tx
          .select({
            id: collection_printings.id,
            currentQuantity: collection_printings.quantity,
            foil: collection_printings.foil,
            etched: collection_printings.etched,
          })
          .from(collection_printings)
          .where(
            and(
              eq(collection_printings.user_id, params.userId),
              eq(collection_printings.printing_id, row.printingId),
              eq(collection_printings.foil, targetFlags.foil),
              eq(collection_printings.etched, targetFlags.etched),
            ),
          )
          .limit(1);

        const nextQuantity = quantity ?? row.currentQuantity;

        if (nextQuantity === 0) {
          await removeCollectionRow(tx, { userId: params.userId, row });
          if (existingTarget && existingTarget.id !== row.id) {
            row = {
              id: existingTarget.id,
              printingId: row.printingId,
              currentQuantity: existingTarget.currentQuantity,
              foil: existingTarget.foil,
              etched: existingTarget.etched,
            };
          } else {
            return { ok: true, removed: true };
          }
        } else if (existingTarget && existingTarget.id !== row.id) {
          const mergedQuantity = nextQuantity;
          const targetDelta = mergedQuantity - existingTarget.currentQuantity;

          await tx
            .update(collection_printings)
            .set({ quantity: mergedQuantity })
            .where(eq(collection_printings.id, existingTarget.id));

          await removeCollectionRow(tx, { userId: params.userId, row });

          if (targetDelta !== 0) {
            await writeQuantityLog(tx, {
              userId: params.userId,
              printingId: row.printingId,
              foil: existingTarget.foil,
              etched: existingTarget.etched,
              change: targetDelta,
            });
          }

          row = {
            id: existingTarget.id,
            printingId: row.printingId,
            currentQuantity: mergedQuantity,
            foil: existingTarget.foil,
            etched: existingTarget.etched,
          };
        } else {
          await tx
            .update(collection_printings)
            .set({
              foil: targetFlags.foil,
              etched: targetFlags.etched,
              quantity: nextQuantity,
            })
            .where(eq(collection_printings.id, row.id));

          row = {
            ...row,
            foil: targetFlags.foil,
            etched: targetFlags.etched,
            currentQuantity: nextQuantity,
          };
        }
      }
    }

    if (quantity === undefined) {
      return { ok: true, removed: false, collectionPrintingId: row.id };
    }

    if (quantity === row.currentQuantity) {
      return { ok: true, removed: false, collectionPrintingId: row.id };
    }

    if (quantity === 0) {
      await removeCollectionRow(tx, { userId: params.userId, row });
      return { ok: true, removed: true };
    }

    const delta = quantity - row.currentQuantity;
    await tx
      .update(collection_printings)
      .set({ quantity })
      .where(eq(collection_printings.id, row.id));

    await writeQuantityLog(tx, {
      userId: params.userId,
      printingId: row.printingId,
      foil: row.foil,
      etched: row.etched,
      change: delta,
    });

    return { ok: true, removed: false, collectionPrintingId: row.id };
  });
}

/** @deprecated Use {@link updateCollectionItem} */
export async function updateCollectionItemQuantity(params: {
  userId: number;
  collectionPrintingId: number;
  quantity: number;
}): Promise<UpdateCollectionItemResult | null> {
  return updateCollectionItem({
    userId: params.userId,
    collectionPrintingId: params.collectionPrintingId,
    quantity: params.quantity,
  });
}
