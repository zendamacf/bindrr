import {
  DEFAULT_SCRYFALL_LANGUAGE,
  normalizeScryfallLanguageCode,
  SCRYFALL_LANGUAGE_CODES,
} from '../../scryfall/languages';
import type { CardFinish } from '../finish';
import { parseCsv } from './parseCsv';

export const IMPORT_MAX_BYTES = 5 * 1024 * 1024;
export const IMPORT_MAX_ROWS = 5000;
export const IMPORT_MAX_QUANTITY = 99999;

export type ImportRow = {
  /** Line number in the CSV file (the header is line 1). */
  line: number;
  set: string;
  collectorNumber: string;
  language: string;
  finish: CardFinish;
  quantity: number;
  scryfallId: string | null;
};

export type ImportRowError = { line: number; reason: string };

export type ParseImportResult = {
  rows: ImportRow[];
  errors: ImportRowError[];
  /** Set when the file cannot be read at all (for example a missing column). */
  fatal: string | null;
};

const SCRYFALL_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const TRUE_VALUES = new Set(['true', '1', 'yes', 'y', 'foil', 'etched']);
const FALSE_VALUES = new Set(['', 'false', '0', 'no', 'n']);

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function parseBoolean(value: string): boolean | null {
  const normalized = value.trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return null;
}

/**
 * Reads CSV text and returns valid rows and row errors.
 * Required columns: set, collector_number, quantity.
 * Optional columns: language, finish, foil, etched, scryfall_id.
 */
export function parseImportRows(text: string): ParseImportResult {
  const records = parseCsv(text);
  const empty = { rows: [], errors: [] };

  if (records.length === 0) {
    return { ...empty, fatal: 'The file is empty.' };
  }

  const header = records[0].fields.map(normalizeHeader);
  const column = (name: string) => header.indexOf(name);

  const setIdx = column('set');
  const numberIdx = column('collector_number');
  const quantityIdx = column('quantity');
  const missing = [
    setIdx < 0 && 'set',
    numberIdx < 0 && 'collector_number',
    quantityIdx < 0 && 'quantity',
  ].filter(Boolean);
  if (missing.length > 0) {
    return { ...empty, fatal: `Missing required column: ${missing.join(', ')}.` };
  }

  const languageIdx = column('language');
  const finishIdx = column('finish');
  const foilIdx = column('foil');
  const etchedIdx = column('etched');
  const scryfallIdIdx = column('scryfall_id');

  const dataRecords = records.slice(1);
  if (dataRecords.length > IMPORT_MAX_ROWS) {
    return { ...empty, fatal: `The file has more than ${IMPORT_MAX_ROWS} rows.` };
  }

  const rows: ImportRow[] = [];
  const errors: ImportRowError[] = [];

  for (const { line, fields } of dataRecords) {
    const cell = (index: number) => (index >= 0 ? (fields[index] ?? '').trim() : '');
    const fail = (reason: string) => errors.push({ line, reason });

    if (fields.length > header.length) {
      fail('The row has more columns than the header.');
      continue;
    }

    const scryfallIdRaw = cell(scryfallIdIdx).toLowerCase();
    if (scryfallIdRaw && !SCRYFALL_ID_PATTERN.test(scryfallIdRaw)) {
      fail('Invalid scryfall_id.');
      continue;
    }

    const set = cell(setIdx).toLowerCase();
    const collectorNumber = cell(numberIdx);
    if (!scryfallIdRaw && (!set || !collectorNumber)) {
      fail('Set and collector_number are required.');
      continue;
    }

    const quantityRaw = cell(quantityIdx);
    const quantity = Number(quantityRaw);
    if (!/^\d+$/.test(quantityRaw) || quantity < 1 || quantity > IMPORT_MAX_QUANTITY) {
      fail(`Quantity must be a whole number from 1 to ${IMPORT_MAX_QUANTITY}.`);
      continue;
    }

    const languageRaw = cell(languageIdx);
    const language = languageRaw
      ? normalizeScryfallLanguageCode(languageRaw)
      : DEFAULT_SCRYFALL_LANGUAGE;
    if (!(SCRYFALL_LANGUAGE_CODES as readonly string[]).includes(language)) {
      fail(`Unknown language "${languageRaw}".`);
      continue;
    }

    const finish = parseFinish({
      finish: cell(finishIdx),
      foil: cell(foilIdx),
      etched: cell(etchedIdx),
    });
    if ('error' in finish) {
      fail(finish.error);
      continue;
    }

    rows.push({
      line,
      set,
      collectorNumber,
      language,
      finish: finish.value,
      quantity,
      scryfallId: scryfallIdRaw || null,
    });
  }

  return { rows, errors, fatal: null };
}

function parseFinish(values: {
  finish: string;
  foil: string;
  etched: string;
}): { value: CardFinish } | { error: string } {
  if (values.finish) {
    const normalized = values.finish.toLowerCase().replace(/[\s_-]+/g, '');
    if (normalized === 'nonfoil' || normalized === 'normal') return { value: 'nonfoil' };
    if (normalized === 'foil' || normalized === 'etched') return { value: normalized };
    return { error: 'Finish must be nonfoil, foil or etched.' };
  }

  const foil = parseBoolean(values.foil);
  const etched = parseBoolean(values.etched);
  if (foil === null || etched === null) {
    return { error: 'Foil and etched must be true or false.' };
  }
  if (foil && etched) return { error: 'A card cannot be foil and etched.' };
  if (etched) return { value: 'etched' };
  if (foil) return { value: 'foil' };
  return { value: 'nonfoil' };
}
