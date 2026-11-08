import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { addPrintingToCollection } from '../addPrintingToCollection';
import { ensurePrinting } from '../ensurePrinting';
import type { ImportPlan, ImportPlanEntry, ImportProgress } from './buildImportPlan';
import type { ImportRowError } from './parseImportRows';

export type ImportSummary = {
  /** Entries that are new in the collection. */
  added: number;
  /** Entries that the user owned already. Their quantity went up. */
  updated: number;
  /** Rows that the import did not use because they have an error. */
  skipped: number;
  /** Entries that could not be saved. */
  failed: number;
  copiesAdded: number;
  errors: ImportRowError[];
};

export type EntryWriter = (userId: number, entry: ImportPlanEntry) => Promise<void>;

export const writeEntry: EntryWriter = async (userId, entry) => {
  await db.transaction(async (tx) => {
    const printingId =
      entry.printing.printingId ??
      (await ensurePrinting(tx, entry.printing.scryfallId, entry.printing.card ?? undefined));
    await addPrintingToCollection(tx, {
      userId,
      printingId,
      quantity: entry.quantityToAdd,
      finish: entry.finish,
    });
  });
};

/**
 * Saves the entries of a plan. Each entry is a separate transaction,
 * so an entry that fails does not stop the others.
 */
export async function commitImportPlan(
  plan: ImportPlan,
  userId: number,
  onProgress?: (progress: ImportProgress) => void,
  write: EntryWriter = writeEntry,
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    added: 0,
    updated: 0,
    skipped: plan.errors.length,
    failed: 0,
    copiesAdded: 0,
    errors: [...plan.errors],
  };

  const total = plan.entries.length;
  onProgress?.({ stage: 'commit', done: 0, total });

  for (const [index, entry] of plan.entries.entries()) {
    try {
      await write(userId, entry);
      if (entry.currentQuantity > 0) summary.updated++;
      else summary.added++;
      summary.copiesAdded += entry.quantityToAdd;
    } catch (error) {
      logger.error(
        { userId, scryfallId: entry.printing.scryfallId, error: String(error) },
        '[import] could not save entry',
      );
      summary.failed++;
      summary.errors.push({
        line: entry.lines[0],
        reason: `Could not save ${entry.printing.name}. Try again.`,
      });
    }
    onProgress?.({ stage: 'commit', done: index + 1, total });
  }

  summary.errors.sort((a, b) => a.line - b.line);
  return summary;
}
