import { and, eq, sql } from 'drizzle-orm';
import type { db } from '@/lib/db';
import { collection_logs, collection_printings } from '@/lib/db/schema';
import { type CardFinish, finishFlags } from './finish';

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Adds copies of a printing to the collection of a user and writes a collection log entry.
 * If the user has the same printing and finish, this function increases the quantity.
 * The quantity must be a whole number of 1 or more.
 */
export async function addPrintingToCollection(
  tx: DbTransaction,
  params: { userId: number; printingId: number; quantity: number; finish: CardFinish },
): Promise<{ collectionPrintingId: number }> {
  const { foil, etched } = finishFlags(params.finish);

  const updated = await tx
    .update(collection_printings)
    .set({ quantity: sql`${collection_printings.quantity} + ${params.quantity}` })
    .where(
      and(
        eq(collection_printings.user_id, params.userId),
        eq(collection_printings.printing_id, params.printingId),
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
          printing_id: params.printingId,
          foil,
          etched,
          quantity: params.quantity,
        })
        .returning({ id: collection_printings.id })
    )[0];

  await tx.insert(collection_logs).values({
    user_id: params.userId,
    printing_id: params.printingId,
    foil,
    etched,
    change: params.quantity,
  });

  return { collectionPrintingId: row.id };
}
