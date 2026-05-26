import * as Sentry from '@sentry/nextjs';
import { SCRYFALL_SYMBOL_SVG_URIS } from './symbolMap';

export type ScryfallSymbolPart =
  | { kind: 'text'; value: string }
  | { kind: 'symbol'; value: string };

const SYMBOL_PATTERN = /\{[^}]+\}/g;

const reportedUnknownSymbols = new Set<string>();

export function splitScryfallSymbolText(text: string): ScryfallSymbolPart[] {
  if (!text) return [];

  const parts: ScryfallSymbolPart[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(SYMBOL_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ kind: 'text', value: text.slice(lastIndex, index) });
    }
    parts.push({ kind: 'symbol', value: match[0] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ kind: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}

export function scryfallSymbolSvgUri(symbol: string): string | null {
  return SCRYFALL_SYMBOL_SVG_URIS[symbol] ?? null;
}

/** Report once per unknown symbol token per page load. */
export function reportUnknownScryfallSymbol(symbol: string): void {
  if (reportedUnknownSymbols.has(symbol)) return;
  reportedUnknownSymbols.add(symbol);

  Sentry.captureException(new Error(`Unknown Scryfall symbol: ${symbol}`));
}

/** @internal Test helper */
export function clearReportedUnknownSymbols(): void {
  reportedUnknownSymbols.clear();
}
