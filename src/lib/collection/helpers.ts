import { scryfallPrintingImageUrl, scryfallSetSymbolUrl } from '@/lib/scryfall/client';
import { scryfallLanguageLabel } from '@/lib/scryfall/languages';

export const COLLECTION_PAGE_SIZE = 20;

const RARITY_LABELS: Record<string, string> = {
  C: 'Common',
  U: 'Uncommon',
  R: 'Rare',
  M: 'Mythic',
  S: 'Special',
};

export function pageCount(total: number, limit: number): number {
  if (total <= 0) return 0;
  return Math.ceil(total / limit);
}

export function paginateSlice<T>(items: readonly T[], page: number, pageSize: number): T[] {
  return items.slice((page - 1) * pageSize, page * pageSize);
}

/** Keeps page unchanged when there are no pages; otherwise caps at the last page. */
export function clampPage(page: number, totalPages: number): number {
  if (totalPages <= 0) return page;
  return Math.min(page, totalPages);
}

export function rarityLabel(rarity: string | null): string | null {
  if (!rarity) return null;
  return RARITY_LABELS[rarity] ?? rarity;
}

export function unitPrice(
  foil: boolean,
  etched: boolean,
  price: string | null,
  foilprice: string | null,
  etchedprice: string | null,
): number | null {
  const raw = etched ? etchedprice : foil ? foilprice : price;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function printingImageUrl(scryfallId: string | null): string | null {
  return scryfallPrintingImageUrl(scryfallId);
}

export function resolveSetSymbolUrl(
  symbolSvgUri: string | null | undefined,
  setCode: string | null,
): string | null {
  if (symbolSvgUri) return symbolSvgUri;
  return scryfallSetSymbolUrl(setCode);
}

/** @deprecated Use {@link resolveSetSymbolUrl} with stored `card_sets.symbol_svg_uri`. */
export function setSymbolImageUrl(setCode: string | null): string | null {
  return scryfallSetSymbolUrl(setCode);
}

export function formatLanguage(language: string | null): string {
  return scryfallLanguageLabel(language);
}
