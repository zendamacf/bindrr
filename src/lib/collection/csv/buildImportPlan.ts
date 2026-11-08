import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { collection_printings } from '@/lib/db/schema';
import { type CardFinish, finishFromFlags } from '../finish';
import { findStoredPrintings } from './findStoredPrintings';
import { type ImportRowError, parseImportRows } from './parseImportRows';
import {
  defaultResolveDeps,
  type ResolveDeps,
  type ResolvedPrinting,
  resolveImportRows,
} from './resolveImportRows';
import type { ImportPreviewEntry, ImportStage } from './types';

export type ImportProgress = { stage: ImportStage; done: number; total: number };

/** One printing and finish to add. Rows in the file that point to the same one are merged. */
export type ImportPlanEntry = {
  printing: ResolvedPrinting;
  finish: CardFinish;
  /** The line numbers of the rows that are merged into this entry. */
  lines: number[];
  quantityToAdd: number;
  currentQuantity: number;
  newQuantity: number;
};

export type ImportPlan = {
  /** Set when the file cannot be read at all. */
  fatal: string | null;
  entries: ImportPlanEntry[];
  errors: ImportRowError[];
  rowCount: number;
};

export type PlanDeps = {
  resolve: ResolveDeps;
  /** Returns the quantity the user owns, keyed by `${printingId}:${finish}`. */
  findOwnedQuantities: (userId: number, printingIds: number[]) => Promise<Map<string, number>>;
};

export function ownedKey(printingId: number, finish: CardFinish): string {
  return `${printingId}:${finish}`;
}

export async function findOwnedQuantities(
  userId: number,
  printingIds: number[],
): Promise<Map<string, number>> {
  const owned = new Map<string, number>();
  for (let i = 0; i < printingIds.length; i += 500) {
    const rows = await db
      .select({
        printingId: collection_printings.printing_id,
        foil: collection_printings.foil,
        etched: collection_printings.etched,
        quantity: collection_printings.quantity,
      })
      .from(collection_printings)
      .where(
        and(
          eq(collection_printings.user_id, userId),
          inArray(collection_printings.printing_id, printingIds.slice(i, i + 500)),
        ),
      );
    for (const row of rows) {
      owned.set(ownedKey(row.printingId, finishFromFlags(row.foil, row.etched)), row.quantity);
    }
  }
  return owned;
}

export const defaultPlanDeps = (): PlanDeps => ({
  resolve: defaultResolveDeps(findStoredPrintings),
  findOwnedQuantities,
});

/**
 * Reads the CSV text and works out what an import changes for the user.
 * This function does not write to the database.
 */
export async function buildImportPlan(
  text: string,
  userId: number,
  deps: PlanDeps = defaultPlanDeps(),
  onProgress?: (progress: ImportProgress) => void,
): Promise<ImportPlan> {
  onProgress?.({ stage: 'parse', done: 0, total: 1 });
  const parsed = parseImportRows(text);
  const rowCount = parsed.rows.length + parsed.errors.length;
  if (parsed.fatal) return { fatal: parsed.fatal, entries: [], errors: [], rowCount: 0 };

  const resolutions = await resolveImportRows(parsed.rows, deps.resolve, (progress) =>
    onProgress?.(progress),
  );

  const errors: ImportRowError[] = [...parsed.errors];
  const merged = new Map<string, ImportPlanEntry>();

  for (const resolution of resolutions) {
    if ('error' in resolution) {
      errors.push({ line: resolution.row.line, reason: resolution.error });
      continue;
    }
    const { row, printing } = resolution;
    const key = `${printing.scryfallId}:${row.finish}`;
    const existing = merged.get(key);
    if (existing) {
      existing.lines.push(row.line);
      existing.quantityToAdd += row.quantity;
    } else {
      merged.set(key, {
        printing,
        finish: row.finish,
        lines: [row.line],
        quantityToAdd: row.quantity,
        currentQuantity: 0,
        newQuantity: 0,
      });
    }
  }

  const entries = [...merged.values()];
  onProgress?.({ stage: 'collection', done: 0, total: 1 });
  const printingIds = [
    ...new Set(
      entries.flatMap((entry) =>
        entry.printing.printingId != null ? [entry.printing.printingId] : [],
      ),
    ),
  ];
  const owned =
    printingIds.length > 0 ? await deps.findOwnedQuantities(userId, printingIds) : new Map();

  for (const entry of entries) {
    const printingId = entry.printing.printingId;
    entry.currentQuantity =
      printingId != null ? (owned.get(ownedKey(printingId, entry.finish)) ?? 0) : 0;
    entry.newQuantity = entry.currentQuantity + entry.quantityToAdd;
  }

  errors.sort((a, b) => a.line - b.line);
  entries.sort((a, b) => a.lines[0] - b.lines[0]);
  onProgress?.({ stage: 'collection', done: 1, total: 1 });

  return { fatal: null, entries, errors, rowCount };
}

export function toPreviewEntry(entry: ImportPlanEntry): ImportPreviewEntry {
  return {
    lines: entry.lines,
    name: entry.printing.name,
    setCode: entry.printing.setCode,
    collectorNumber: entry.printing.collectorNumber,
    language: entry.printing.language,
    finish: entry.finish,
    quantityToAdd: entry.quantityToAdd,
    currentQuantity: entry.currentQuantity,
    newQuantity: entry.newQuantity,
  };
}
