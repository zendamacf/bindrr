import {
  SCRYFALL_COLLECTION_BATCH_SIZE,
  type ScryfallCard,
  type ScryfallIdentifier,
  scryfallFetchCollectionByIdentifiers,
  scryfallFinishAvailability,
  scryfallGetCardBySetNumberLang,
} from '@/lib/scryfall/client';
import { DEFAULT_SCRYFALL_LANGUAGE } from '@/lib/scryfall/languages';
import { throttledScryfall } from '@/lib/scryfall/throttle';
import type { CardFinish } from '../finish';
import { printingFinishAvailability } from '../printingFinishAvailability';
import type { ImportRow } from './parseImportRows';

/** A printing that an import row points to. */
export type ResolvedPrinting = {
  scryfallId: string;
  /** The printing ID in the database. It is null if Scryfall gave the printing and it is not stored yet. */
  printingId: number | null;
  /** The card from Scryfall. It is null if the printing is already in the database. */
  card: ScryfallCard | null;
  name: string;
  setCode: string;
  collectorNumber: string;
  language: string;
  canAddNonfoil: boolean;
  canAddFoil: boolean;
  canAddEtched: boolean;
};

export type RowResolution =
  | { row: ImportRow; printing: ResolvedPrinting }
  | { row: ImportRow; error: string };

export type DbPrintingMatch = {
  printingId: number;
  scryfallId: string;
  name: string;
  setCode: string;
  collectorNumber: string;
  language: string;
  price: string | null;
  foilprice: string | null;
  etchedprice: string | null;
};

export type ResolveDeps = {
  /** Finds printings that are stored already. Returns the match for each key. */
  findStoredPrintings: (keys: LookupKey[]) => Promise<Map<string, DbPrintingMatch>>;
  fetchByIdentifiers: (identifiers: ScryfallIdentifier[]) => Promise<ScryfallCard[]>;
  fetchBySetNumberLang: (
    setCode: string,
    collectorNumber: string,
    language: string,
  ) => Promise<ScryfallCard | null>;
};

export type LookupKey =
  | { key: string; scryfallId: string }
  | { key: string; set: string; collectorNumber: string; language: string };

export type ResolveProgress = { stage: 'lookup' | 'scryfall'; done: number; total: number };

export const defaultResolveDeps = (
  findStoredPrintings: ResolveDeps['findStoredPrintings'],
): ResolveDeps => ({
  findStoredPrintings,
  // The throttle waits for a free time and tries again one time after HTTP 429.
  fetchByIdentifiers: (identifiers) =>
    throttledScryfall(() => scryfallFetchCollectionByIdentifiers(identifiers)),
  fetchBySetNumberLang: (setCode, collectorNumber, language) =>
    throttledScryfall(() => scryfallGetCardBySetNumberLang(setCode, collectorNumber, language)),
});

export function lookupKeyForRow(row: ImportRow): string {
  if (row.scryfallId) return `id:${row.scryfallId}`;
  return `sn:${row.set}:${row.collectorNumber.toLowerCase()}:${row.language}`;
}

function toLookupKey(row: ImportRow): LookupKey {
  const key = lookupKeyForRow(row);
  return row.scryfallId
    ? { key, scryfallId: row.scryfallId }
    : { key, set: row.set, collectorNumber: row.collectorNumber, language: row.language };
}

function fromStored(match: DbPrintingMatch): ResolvedPrinting {
  return {
    scryfallId: match.scryfallId,
    printingId: match.printingId,
    card: null,
    name: match.name,
    setCode: match.setCode,
    collectorNumber: match.collectorNumber,
    language: match.language,
    ...printingFinishAvailability(match.price, match.foilprice, match.etchedprice),
  };
}

function fromScryfall(card: ScryfallCard): ResolvedPrinting {
  return {
    scryfallId: card.id,
    printingId: null,
    card,
    name: card.name,
    setCode: card.set.toUpperCase(),
    collectorNumber: card.collector_number,
    language: card.lang ?? DEFAULT_SCRYFALL_LANGUAGE,
    ...scryfallFinishAvailability(card.finishes),
  };
}

export function finishIsAvailable(printing: ResolvedPrinting, finish: CardFinish): boolean {
  if (finish === 'foil') return printing.canAddFoil;
  if (finish === 'etched') return printing.canAddEtched;
  return printing.canAddNonfoil;
}

function notFoundMessage(row: ImportRow): string {
  if (row.scryfallId) return `Card ${row.scryfallId} was not found.`;
  return `Card not found: set ${row.set.toUpperCase()}, number ${row.collectorNumber}, language ${row.language}.`;
}

/**
 * Finds the printing for each row. It looks in the database first.
 * Then it asks Scryfall for the printings that are not stored.
 * Each unique printing is looked up one time, even if many rows point to it.
 */
export async function resolveImportRows(
  rows: ImportRow[],
  deps: ResolveDeps,
  onProgress?: (progress: ResolveProgress) => void,
): Promise<RowResolution[]> {
  const uniqueKeys = new Map<string, LookupKey>();
  for (const row of rows) {
    const key = lookupKeyForRow(row);
    if (!uniqueKeys.has(key)) uniqueKeys.set(key, toLookupKey(row));
  }

  const total = uniqueKeys.size;
  const resolved = new Map<string, ResolvedPrinting>();
  onProgress?.({ stage: 'lookup', done: 0, total });

  const stored = await deps.findStoredPrintings([...uniqueKeys.values()]);
  for (const [key, match] of stored) {
    resolved.set(key, fromStored(match));
  }
  onProgress?.({ stage: 'lookup', done: resolved.size, total });

  const missing = [...uniqueKeys.values()].filter((entry) => !resolved.has(entry.key));
  const batchable: Array<{ entry: LookupKey; identifier: ScryfallIdentifier }> = [];
  const single: Array<Extract<LookupKey, { set: string }>> = [];

  for (const entry of missing) {
    if ('scryfallId' in entry) {
      batchable.push({ entry, identifier: { id: entry.scryfallId } });
    } else if (entry.language === DEFAULT_SCRYFALL_LANGUAGE) {
      batchable.push({
        entry,
        identifier: { set: entry.set, collector_number: entry.collectorNumber },
      });
    } else {
      single.push(entry);
    }
  }

  let done = resolved.size;

  for (let offset = 0; offset < batchable.length; offset += SCRYFALL_COLLECTION_BATCH_SIZE) {
    const chunk = batchable.slice(offset, offset + SCRYFALL_COLLECTION_BATCH_SIZE);
    const cards = await deps.fetchByIdentifiers(chunk.map((item) => item.identifier));

    const byId = new Map(cards.map((card) => [card.id, card]));
    const bySetNumber = new Map(
      cards.map((card) => [
        `${card.set.toLowerCase()}:${card.collector_number.toLowerCase()}`,
        card,
      ]),
    );

    for (const { entry } of chunk) {
      const card =
        'scryfallId' in entry
          ? byId.get(entry.scryfallId)
          : bySetNumber.get(`${entry.set}:${entry.collectorNumber.toLowerCase()}`);
      if (card) resolved.set(entry.key, fromScryfall(card));
    }
    done += chunk.length;
    onProgress?.({ stage: 'scryfall', done, total });
  }

  for (const entry of single) {
    const card = await deps.fetchBySetNumberLang(entry.set, entry.collectorNumber, entry.language);
    if (card) resolved.set(entry.key, fromScryfall(card));
    done += 1;
    onProgress?.({ stage: 'scryfall', done, total });
  }

  return rows.map((row): RowResolution => {
    const printing = resolved.get(lookupKeyForRow(row));
    if (!printing) return { row, error: notFoundMessage(row) };
    if (!finishIsAvailable(printing, row.finish)) {
      return { row, error: `${printing.name} is not available in this finish.` };
    }
    return { row, printing };
  });
}
