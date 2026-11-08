import type { CardFinish } from '../finish';
import type { ImportRowError } from './parseImportRows';

export type { ImportRowError };

export type ImportStage = 'parse' | 'lookup' | 'scryfall' | 'collection' | 'commit';

export type ImportPreviewEntry = {
  lines: number[];
  name: string;
  setCode: string;
  collectorNumber: string;
  language: string;
  finish: CardFinish;
  quantityToAdd: number;
  currentQuantity: number;
  newQuantity: number;
};

export type ImportPreviewResult = {
  /** Set when the file cannot be read at all. */
  fatal: string | null;
  rowCount: number;
  entries: ImportPreviewEntry[];
  errors: ImportRowError[];
};

export type ImportSummaryResult = {
  added: number;
  updated: number;
  skipped: number;
  failed: number;
  copiesAdded: number;
  errors: ImportRowError[];
};

export type ImportPreviewEvent =
  | { type: 'progress'; stage: ImportStage; done: number; total: number }
  | { type: 'result'; result: ImportPreviewResult };

export type ImportCommitEvent =
  | { type: 'progress'; stage: ImportStage; done: number; total: number }
  | { type: 'result'; fatal: string | null; summary: ImportSummaryResult | null };
