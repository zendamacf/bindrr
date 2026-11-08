import { db } from '@/lib/db';
import { addPrintingToCollection } from './addPrintingToCollection';
import { ensurePrinting } from './ensurePrinting';
import type { CardFinish } from './finish';

export async function addToCollection(params: {
  userId: number;
  scryfallId: string;
  quantity: number;
  finish: CardFinish;
}) {
  const quantity = Math.max(1, Math.floor(params.quantity));

  return db.transaction(async (tx) => {
    const printingId = await ensurePrinting(tx, params.scryfallId);
    const { collectionPrintingId } = await addPrintingToCollection(tx, {
      userId: params.userId,
      printingId,
      quantity,
      finish: params.finish,
    });

    return { ok: true, collectionPrintingId, printingId };
  });
}
